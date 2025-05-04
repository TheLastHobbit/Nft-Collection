pragma solidity ^0.8.0;

contract NFTMarketVoting {
    // 投票结果枚举
    enum VoteResult { Pending, Approved, Rejected }

    // 投票结构体
    struct Vote {
        address voter;
        bool hasVoted;
        bool approve;
    }

    // 投票请求结构体
    struct VoteRequest {
        uint256 tokenId; // NFT的ID
        address requester; // 发起投票的用户
        Vote[3] votes; // 三名投票者的记录
        uint256 voteCount; // 当前投票数
        uint256 approveCount; // 赞同票数
        VoteResult result; // 投票结果
    }

    // 存储所有投票请求
    mapping(uint256 => VoteRequest) public voteRequests;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    // tokenId 到 requestId 的映射
    mapping(uint256 => uint256) public tokenToRequestId;
    // 投票请求计数器
    uint256 public voteRequestCounter;

    // 事件
    event VoteRequestCreated(uint256 indexed requestId, uint256 tokenId, address requester);
    event Voted(uint256 indexed requestId, address voter, bool approve);
    event VoteFinalized(uint256 indexed requestId, VoteResult result);

    // 修饰符：确保投票者未投过票
    modifier notVoted(uint256 requestId) {
        require(!hasVoted[requestId][msg.sender], "Already voted");
        _;
    }

    // 修饰符：确保投票请求存在且未结束
    modifier validRequest(uint256 requestId) {
        require(requestId > 0 && requestId <= voteRequestCounter, "Invalid request ID");
        require(voteRequests[requestId].result == VoteResult.Pending, "Voting has ended");
        _;
    }

    // 获取所有投票请求ID
    function getAllVoteRequests() public view returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](voteRequestCounter);
        for (uint256 i = 1; i <= voteRequestCounter; i++) {
            ids[i - 1] = i;
        }
        return ids;
    }

    // 检查投票状态
    function checkVoteStatus(uint256 requestId, address voter) public view returns (bool) {
        return hasVoted[requestId][voter];
    }

    // 通过 tokenId 获取 requestId
    function getRequestIdByTokenId(uint256 tokenId) public view returns (uint256) {
        return tokenToRequestId[tokenId];
    }

    // 创建投票请求
    function createVoteRequest(uint256 tokenId) external returns (uint256) {
        require(tokenToRequestId[tokenId] == 0, "Vote request already exists for this token");
        voteRequestCounter++;
        VoteRequest storage newRequest = voteRequests[voteRequestCounter];
        newRequest.tokenId = tokenId;
        newRequest.requester = msg.sender;
        newRequest.result = VoteResult.Pending;

        tokenToRequestId[tokenId] = voteRequestCounter;

        emit VoteRequestCreated(voteRequestCounter, tokenId, msg.sender);
        return voteRequestCounter;
    }

    // 投票
    function vote(uint256 requestId, bool approve) 
        external 
        notVoted(requestId) 
        validRequest(requestId) 
    {
        VoteRequest storage request = voteRequests[requestId];
        require(msg.sender != request.requester, "Requester cannot vote");

        // 记录投票
        bool slotFound = false;
        for (uint256 i = 0; i < 3; i++) {
            if (request.votes[i].voter == address(0)) {
                request.votes[i].voter = msg.sender;
                request.votes[i].hasVoted = true;
                request.votes[i].approve = approve;
                slotFound = true;
                break;
            }
        }
        require(slotFound, "No available vote slots");

        request.voteCount++;
        if (approve) {
            request.approveCount++;
        }
        hasVoted[requestId][msg.sender] = true;

        emit Voted(requestId, msg.sender, approve);

        // 检查是否达到投票结束条件
        if (request.voteCount >= 3) {
            finalizeVote(requestId);
        }
    }

    // 结束投票并确定结果
    function finalizeVote(uint256 requestId) internal {
        VoteRequest storage request = voteRequests[requestId];
        require(request.voteCount >= 3, "Not enough votes");
        require(request.result == VoteResult.Pending, "Voting already finalized");

        if (request.approveCount >= 2) {
            request.result = VoteResult.Approved;
        } else {
            request.result = VoteResult.Rejected;
        }

        emit VoteFinalized(requestId, request.result);
    }

    // 查询投票状态
    function getVoteStatus(uint256 requestId) 
        external 
        view 
        returns (
            uint256 tokenId,
            address requester,
            uint256 voteCount,
            uint256 approveCount,
            VoteResult result
        ) 
    {
        VoteRequest storage request = voteRequests[requestId];
        return (
            request.tokenId,
            request.requester,
            request.voteCount,
            request.approveCount,
            request.result
        );
    }
}