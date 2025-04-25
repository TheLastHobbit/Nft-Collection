// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract cUSDT is ERC20 {
    // 跟踪每个地址是否已铸造
    mapping(address => bool) private _hasMinted;

    // 铸造事件
    event Minted(address indexed account, uint256 amount);

    constructor() ERC20("fake USDT", "cUSDT") {
        // 部署时给部署者铸造 1 亿 cUSDT
        _mint(msg.sender, 1 * 10**8 * 10**decimals());
    }

    // 允许任何人铸造 100 cUSDT，仅限一次
    function mint() external {
        require(!_hasMinted[msg.sender], "cUSDT: Address has already minted");
        
        // 标记该地址已铸造
        _hasMinted[msg.sender] = true;
        
        // 铸造 100 cUSDT (100 * 10^18)
        uint256 amount = 100 * 10**decimals();
        _mint(msg.sender, amount);
        
        // 触发铸造事件
        emit Minted(msg.sender, amount);
    }

    // 查看地址是否已铸造
    function hasMinted(address account) external view returns (bool) {
        return _hasMinted[account];
    }
}