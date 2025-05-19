// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

/**
 * @title NFTMarket 合约，支持锁定资金、纠纷解决、确认交易和查询所有纠纷
 */
contract Market is IERC721Receiver {
    IERC20 public erc20;
    IERC721 public erc721;

    bytes4 internal constant MAGIC_ON_ERC721_RECEIVED = 0x150b7a02;

    // 纠纷投票结果枚举
    enum DisputeResult { Pending, BuyerWins, SellerWins }

    // 纠纷投票结构体
    struct DisputeVote {
        address voter;
        bool hasVoted;
        bool approveBuyer; // true 表示支持买家，false 表示支持卖家
    }

    // 纠纷结构体
    struct Dispute {
        address seller;
        address buyer;
        uint256 amount;
        uint256 timestamp;
        DisputeResult result;
        uint256 voteRequestId; // 关联投票请求
        uint256 tokenId; // 关联的 tokenId
    }

    // 待确认交易结构体
    struct PendingTransaction {
        address buyer;
        address seller;
        uint256 amount;
    }

    // 纠纷投票请求结构体
    struct DisputeVoteRequest {
        uint256 tokenId;
        address requester;
        DisputeVote[3] votes;
        uint256 voteCount;
        uint256 approveBuyerCount; // 支持买家的票数
        DisputeResult result;
    }

    struct Order {
        address seller;
        uint256 tokenId;
        uint256 price;
    }

    mapping(uint256 => Order) public orderOfId; // tokenId 到订单
    Order[] public orders;
    mapping(uint256 => uint256) public idToOrderIndex;
    mapping(uint256 => Dispute) public disputes; // tokenId 到纠纷
    mapping(uint256 => uint256) public disputeToRequestId; // tokenId 到投票请求 ID
    mapping(uint256 => DisputeVoteRequest) public disputeVoteRequests; // 投票请求 ID 到投票请求
    mapping(uint256 => mapping(address => bool)) public hasDisputeVoted; // 投票请求 ID 到投票者是否已投票
    mapping(uint256 => mapping(address => bool)) public transactionConfirmations; // tokenId 到确认状态（买家/卖家）
    mapping(uint256 => bool) public transactionCompleted; // tokenId 到交易完成状态
    mapping(uint256 => PendingTransaction) public pendingTransactions; // tokenId 到待确认交易
    uint256 public disputeVoteRequestCounter; // 纠纷投票请求计数器
    uint256[] public disputeTokenIds; // 存储所有纠纷的 tokenId

    event Deal(address buyer, address seller, uint256 tokenId, uint256 price);
    event NewOrder(address seller, uint256 tokenId, uint256 price);
    event CancelOrder(address seller, uint256 tokenId);
    event ChangePrice(address seller, uint256 tokenId, uint256 previousPrice, uint256 price);
    event DisputeCreated(uint256 tokenId, address seller, address buyer, uint256 amount);
    event DisputeVoteRequestCreated(uint256 indexed requestId, uint256 tokenId, address requester);
    event DisputeVoted(uint256 indexed requestId, address voter, bool approveBuyer);
    event DisputeVoteFinalized(uint256 indexed requestId, DisputeResult result);
    event TransactionConfirmed(uint256 indexed tokenId, address confirmer);
    event TransactionCompleted(uint256 indexed tokenId, address buyer, address seller, uint256 amount);

    constructor(IERC20 _erc20, IERC721 _erc721) {
        require(address(_erc20) != address(0), unicode"Market: IERC20 合约地址不能为空");
        require(address(_erc721) != address(0), unicode"Market: IERC721 合约地址不能为空");
        erc20 = _erc20;
        erc721 = _erc721;
    }

    // 修饰符：确保投票者未投票
    modifier notDisputeVoted(uint256 requestId) {
        require(!hasDisputeVoted[requestId][msg.sender], unicode"已投票");
        _;
    }

    // 修饰符：确保投票请求存在且未结束
    modifier validDisputeRequest(uint256 requestId) {
        require(requestId > 0 && requestId <= disputeVoteRequestCounter, unicode"无效的请求 ID");
        require(disputeVoteRequests[requestId].result == DisputeResult.Pending, unicode"投票已结束");
        _;
    }

    // 查询纠纷详情
    function getDispute(uint256 _tokenId) 
        external 
        view 
        returns (
            address seller,
            address buyer,
            uint256 amount,
            uint256 timestamp,
            DisputeResult result,
            uint256 voteRequestId,
            uint256 tokenId
        ) 
    {
        Dispute storage dispute = disputes[_tokenId];
        return (
            dispute.seller,
            dispute.buyer,
            dispute.amount,
            dispute.timestamp,
            dispute.result,
            dispute.voteRequestId,
            dispute.tokenId
        );
    }

    /**
     * @notice 查询所有纠纷
     * @return Dispute[] 包含所有纠纷的数组，每个纠纷包含 seller, buyer, amount, timestamp, result, voteRequestId, tokenId
     */
    function getAllDisputes() external view returns (Dispute[] memory) {
        Dispute[] memory allDisputes = new Dispute[](disputeTokenIds.length);
        for (uint256 i = 0; i < disputeTokenIds.length; i++) {
            allDisputes[i] = disputes[disputeTokenIds[i]];
        }
        return allDisputes;
    }

    // 查询投票详情
    function getDisputeVoteDetails(uint256 requestId) 
        external 
        view 
        returns (DisputeVoteRequest memory) 
    {
        require(requestId > 0 && requestId <= disputeVoteRequestCounter, unicode"无效的请求 ID");
        return disputeVoteRequests[requestId];
    }

    // 购买 NFT，锁定资金并下架
    function buy(uint256 _tokenId) external {
        require(isListed(_tokenId), unicode"Market: 该 tokenId 未上架");
        require(!transactionCompleted[_tokenId], unicode"Market: 交易已完成");

        address seller = orderOfId[_tokenId].seller;
        address buyer = msg.sender;
        uint256 price = orderOfId[_tokenId].price;

        // 锁定资金到合约
        require(erc20.transferFrom(buyer, address(this), price), unicode"Market: 向合约转账失败");

        // 记录待确认交易
        pendingTransactions[_tokenId] = PendingTransaction({
            buyer: buyer,
            seller: seller,
            amount: price
        });

        // 下架 NFT
        removeListing(_tokenId);

        emit Deal(buyer, seller, _tokenId, price);
    }

    // 双方确认交易
    function confirmTransaction(uint256 _tokenId) external {
        require(pendingTransactions[_tokenId].buyer != address(0), unicode"Market: 交易不存在");
        require(!transactionCompleted[_tokenId], unicode"Market: 交易已完成");
        require(disputes[_tokenId].buyer == address(0), unicode"Market: 存在纠纷，无法确认交易");
        require(msg.sender == pendingTransactions[_tokenId].seller || msg.sender == pendingTransactions[_tokenId].buyer, unicode"Market: 仅买家或卖家可确认");

        address seller = pendingTransactions[_tokenId].seller;
        address buyer = pendingTransactions[_tokenId].buyer;
        uint256 amount = pendingTransactions[_tokenId].amount;

        // 记录确认
        transactionConfirmations[_tokenId][msg.sender] = true;
        emit TransactionConfirmed(_tokenId, msg.sender);

        // 检查双方是否都确认
        if (transactionConfirmations[_tokenId][seller] && transactionConfirmations[_tokenId][buyer]) {
            // 执行交易
            require(erc20.transfer(seller, amount), unicode"Market: 向卖家转账失败");
            erc721.safeTransferFrom(address(this), buyer, _tokenId);
            transactionCompleted[_tokenId] = true;
            delete pendingTransactions[_tokenId];

            emit TransactionCompleted(_tokenId, buyer, seller, amount);
        }
    }

    // 创建纠纷并发起投票
    function createDispute(uint256 _tokenId) external {
        require(pendingTransactions[_tokenId].buyer != address(0), unicode"Market: 交易不存在");
        require(!transactionCompleted[_tokenId], unicode"Market: 交易已完成");
        require(disputes[_tokenId].buyer == address(0), unicode"Market: 纠纷已存在");
        require(msg.sender == pendingTransactions[_tokenId].seller || msg.sender == pendingTransactions[_tokenId].buyer, unicode"Market: 仅买家或卖家可创建纠纷");

        address seller = pendingTransactions[_tokenId].seller;
        address buyer = pendingTransactions[_tokenId].buyer;
        uint256 amount = pendingTransactions[_tokenId].amount;

        // 递增投票请求计数器
        disputeVoteRequestCounter++;
        // 创建投票请求
        DisputeVoteRequest storage newRequest = disputeVoteRequests[disputeVoteRequestCounter];
        newRequest.tokenId = _tokenId;
        newRequest.requester = msg.sender;
        newRequest.result = DisputeResult.Pending;

        // 创建纠纷记录
        disputes[_tokenId] = Dispute({
            seller: seller,
            buyer: buyer,
            amount: amount,
            timestamp: block.timestamp,
            result: DisputeResult.Pending,
            voteRequestId: disputeVoteRequestCounter, // 设置为新的 voteRequestId
            tokenId: _tokenId
        });
        disputeTokenIds.push(_tokenId);

        disputeToRequestId[_tokenId] = disputeVoteRequestCounter;

        emit DisputeCreated(_tokenId, seller, buyer, amount);
        emit DisputeVoteRequestCreated(disputeVoteRequestCounter, _tokenId, msg.sender);
    }

    // 投票解决纠纷
    function voteDispute(uint256 requestId, bool approveBuyer) 
        external 
        notDisputeVoted(requestId) 
        validDisputeRequest(requestId) 
    {
        DisputeVoteRequest storage request = disputeVoteRequests[requestId];
        uint256 tokenId = request.tokenId;
        require(msg.sender != disputes[tokenId].seller && msg.sender != disputes[tokenId].buyer, unicode"Market: 卖家或买家不能投票");

        // 记录投票
        bool slotFound = false;
        for (uint256 i = 0; i < 3; i++) {
            if (request.votes[i].voter == address(0)) {
                request.votes[i].voter = msg.sender;
                request.votes[i].hasVoted = true;
                request.votes[i].approveBuyer = approveBuyer;
                slotFound = true;
                break;
            }
        }
        require(slotFound, unicode"Market: 无可用投票槽位");

        request.voteCount++;
        if (approveBuyer) {
            request.approveBuyerCount++;
        }
        hasDisputeVoted[requestId][msg.sender] = true;

        emit DisputeVoted(requestId, msg.sender, approveBuyer);

        // 达到 3 票则结束投票
        if (request.voteCount >= 3) {
            finalizeDisputeVote(requestId);
        }
    }

    // 结束纠纷投票并确定结果
    function finalizeDisputeVote(uint256 requestId) internal {
        DisputeVoteRequest storage request = disputeVoteRequests[requestId];
        uint256 tokenId = request.tokenId;
        require(request.voteCount >= 3, unicode"Market: 票数不足");
        require(request.result == DisputeResult.Pending, unicode"Market: 投票已结束");

        if (request.approveBuyerCount >= 2) {
            request.result = DisputeResult.BuyerWins;
            disputes[tokenId].result = DisputeResult.BuyerWins;
        } else {
            request.result = DisputeResult.SellerWins;
            disputes[tokenId].result = DisputeResult.SellerWins;
        }

        emit DisputeVoteFinalized(requestId, request.result);
    }

    // 根据纠纷结果执行交易
    function executeDisputeTransaction(uint256 _tokenId) external {
        require(disputes[_tokenId].buyer != address(0), unicode"Market: 该 token 无纠纷记录");
        require(disputes[_tokenId].result != DisputeResult.Pending, unicode"Market: 纠纷尚未解决");

        address seller = disputes[_tokenId].seller;
        address buyer = disputes[_tokenId].buyer;
        uint256 amount = disputes[_tokenId].amount;

        if (disputes[_tokenId].result == DisputeResult.BuyerWins) {
            // 退款给买家，NFT 退回卖家
            require(erc20.transfer(buyer, amount), unicode"Market: 退款给买家失败");
            erc721.safeTransferFrom(address(this), seller, _tokenId);
        } else {
            // 金额转给卖家，NFT 转给买家
            require(erc20.transfer(seller, amount), unicode"Market: 向卖家转账失败");
            erc721.safeTransferFrom(address(this), buyer, _tokenId);
        }

        // 清除纠纷记录
        delete disputes[_tokenId];
        delete disputeToRequestId[_tokenId];
        delete pendingTransactions[_tokenId];
        transactionCompleted[_tokenId] = true;

        // 从 disputeTokenIds 移除
        for (uint256 i = 0; i < disputeTokenIds.length; i++) {
            if (disputeTokenIds[i] == _tokenId) {
                disputeTokenIds[i] = disputeTokenIds[disputeTokenIds.length - 1];
                disputeTokenIds.pop();
                break;
            }
        }
    }

    function cancelOrder(uint256 _tokenId) external {
        require(isListed(_tokenId), unicode"Market: 该 tokenId 未上架");
        require(disputes[_tokenId].buyer == address(0), unicode"Market: 存在纠纷，无法取消订单");

        address seller = orderOfId[_tokenId].seller;
        require(seller == msg.sender, unicode"Market: 调用者不是卖家");

        erc721.safeTransferFrom(address(this), seller, _tokenId);
        removeListing(_tokenId);

        emit CancelOrder(seller, _tokenId);
    }

    function changePrice(uint256 _tokenId, uint256 _price) external {
        require(isListed(_tokenId), unicode"Market: 该 tokenId 未上架");
        require(disputes[_tokenId].buyer == address(0), unicode"Market: 存在纠纷，无法更改价格");
        address seller = orderOfId[_tokenId].seller;
        require(seller == msg.sender, unicode"Market: 调用者不是卖家");

        uint256 previousPrice = orderOfId[_tokenId].price;
        orderOfId[_tokenId].price = _price;
        Order storage order = orders[idToOrderIndex[_tokenId]];
        order.price = _price;

        emit ChangePrice(seller, _tokenId, previousPrice, _price);
    }

    function getAllNFTs() public view returns (Order[] memory) {
        return orders;
    }

    function getMyNFTs() public view returns (Order[] memory) {
        Order[] memory myOrders = new Order[](orders.length);
        uint256 myOrdersCount = 0;

        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].seller == msg.sender) {
                myOrders[myOrdersCount] = orders[i];
                myOrdersCount++;
            }
        }

        Order[] memory myOrdersTrimmed = new Order[](myOrdersCount);
        for (uint256 i = 0; i < myOrdersCount; i++) {
            myOrdersTrimmed[i] = myOrders[i];
        }

        return myOrdersTrimmed;
    }

    function isListed(uint256 _tokenId) public view returns (bool) {
        return orderOfId[_tokenId].seller != address(0);
    }

    function getOrderLength() public view returns (uint256) {
        return orders.length;
    }

    function onERC721Received(
        address _operator,
        address _seller,
        uint256 _tokenId,
        bytes calldata _data
    ) public override returns (bytes4) {
        require(_operator == _seller, unicode"Market: 卖家必须是操作者");
        uint256 _price = toUint256(_data, 0);
        placeOrder(_seller, _tokenId, _price);

        return MAGIC_ON_ERC721_RECEIVED;
    }

    function toUint256(bytes memory _bytes, uint256 _start) public pure returns (uint256) {
        require(_start + 32 >= _start, unicode"Market: toUint256 溢出");
        require(_bytes.length >= _start + 32, unicode"Market: toUint256 越界");
        uint256 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x20), _start))
        }

        return tempUint;
    }

    function placeOrder(address _seller, uint256 _tokenId, uint256 _price) public {
        require(_price > 0, unicode"Market: 价格必须大于零");

        orderOfId[_tokenId].seller = _seller;
        orderOfId[_tokenId].price = _price;
        orderOfId[_tokenId].tokenId = _tokenId;

        orders.push(orderOfId[_tokenId]);
        idToOrderIndex[_tokenId] = orders.length - 1;

        emit NewOrder(_seller, _tokenId, _price);
    }

    function removeListing(uint256 _tokenId) internal {
        delete orderOfId[_tokenId];

        uint256 orderToRemoveIndex = idToOrderIndex[_tokenId];
        uint256 lastOrderIndex = orders.length - 1;

        if (lastOrderIndex != orderToRemoveIndex) {
            Order memory lastOrder = orders[lastOrderIndex];
            orders[orderToRemoveIndex] = lastOrder;
            idToOrderIndex[lastOrder.tokenId] = orderToRemoveIndex;
        }

        orders.pop();
    }
}