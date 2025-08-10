// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// 1. 创建一个收款函数
// 2. 记录投资人并且查看
// 3. 在锁定期内，达到目标值，生产商可以提款
// 4. 在锁定期内，没有达到目标值，投资人在锁定期以后可以退款

// 创建一个集资合约
contract FundMe {
    // 用于记录投资人的地址和金额
    mapping(address => uint256) public fundersToAmount;

    // 设定投资人最小投资额度 单位：usd
    uint256 constant MINIMUM_VALUE = 10 * 10 ** 18;

    // 设定投资目标
    uint256 constant TARGET = 100 * 10 ** 18;

    // 合约的拥有者
    address public owner;

    // 设置锁定期
    uint256 deploymentTimestamp;
    uint256 lockTime;

    // erc20合约的地址
    address erc20Addr;

    // 标记集资成功的状态 flag
    bool public getFundSuccess = false;

    AggregatorV3Interface public dataFeed;

    event FundWithdrawByOwner(uint256);

    event RefundByFunder(address, uint256);

    constructor(uint256 _lockTime, address dataFeedAddr) {
        dataFeed = AggregatorV3Interface(dataFeedAddr);
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }

    // 修改funderToAmount,且限制只能被FundTokenERC20调用
    function setFunderToAmount(
        address funder,
        uint256 amountToUpdate
    ) external {
        require(
            msg.sender == erc20Addr,
            "you do't have permission to call this function"
        );
        fundersToAmount[funder] = amountToUpdate;
    }

    // 获取erc20地址
    function setErc20Addr(address _erc20Addr) public isOwner {
        erc20Addr = _erc20Addr;
    }

    // 收款函数 payable 关键字可以使函数具有收款功能
    function fund() external payable miniFund isNotLockTime {
        fundersToAmount[msg.sender] = msg.value;
    }

    // 生产商提款函数
    function getFund() external isTarget isOwner isLockTime {
        // transfer: transfer ETH and revert if transaction failed
        // payable(msg.sender).transfer(address(this).balance);

        // send: transfer ETH and return false if transaction failed
        // bool success = payable(msg.sender).send(address(this).balance);
        // require(success, "transaction failed");

        // call: transfer ETH with data and return value of function or bool
        bool success;
        uint256 balance = address(this).balance;
        (success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "transfer trancation failed");
        fundersToAmount[msg.sender] = 0;
        getFundSuccess = true;
        emit FundWithdrawByOwner(balance);
    }

    // 投资人退款函数
    function reFund() external isNotTarget isFund isLockTime {
        uint256 ethAmount = fundersToAmount[msg.sender];
        bool success;
        (success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "transfer trancation failed");
        fundersToAmount[msg.sender] = 0;
        emit RefundByFunder(msg.sender, ethAmount);
    }

    // 合约转移
    function transferOwnership(address newOwner) public isOwner {
        owner = newOwner;
    }

    // 获取eth对应的usd值
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    //eth转化usd
    function convertEthToUsd(
        uint256 ethAmount
    ) internal view returns (uint256) {
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        return (ethAmount * ethPrice) / (10 ** 8);
    }

    // 函数修改器：判断投资额度大于最小值
    modifier miniFund() {
        require(convertEthToUsd(msg.value) >= MINIMUM_VALUE, "send more eth!");
        _;
    }

    // 判断集资达标
    modifier isTarget() {
        require(
            convertEthToUsd(address(this).balance) >= TARGET,
            "Target is not reached"
        );
        _;
    }

    // 判断集资未达标
    modifier isNotTarget() {
        require(
            convertEthToUsd(address(this).balance) < TARGET,
            "Target is reached"
        );
        _;
    }

    // 判断是合约拥有者
    modifier isOwner() {
        require(
            owner == msg.sender,
            "this function can only be called by owner"
        );
        _;
    }

    // 判断合约中存在当前投资人
    modifier isFund() {
        require(fundersToAmount[msg.sender] != 0, "there is no fund for you");
        _;
    }

    // 判断合约处于预定期内
    modifier isNotLockTime() {
        require(
            block.timestamp - deploymentTimestamp <= lockTime,
            "window is closed"
        );
        _;
    }

    // 判断合约处于锁定期外
    modifier isLockTime() {
        require(
            block.timestamp - deploymentTimestamp > lockTime,
            "window is opened"
        );
        _;
    }
}

/* 
    1、为什么区块链网络无法获取链下的数据
        区块链上的所有的运算和数据都不是由中心化的节点进行的，而是所有的节点（或者大多数节点）都需要执行一样的运算来验证，这就叫共识
    2、DON
        去中心化预言机网络
    3、ERC20和ERC721的区别
        ERC20: Fungible Token 1.每个Token都是一样的 2.可以切分
        ERC721: NFT Non-Fungible Token 1.每个Token都是独特的 2.无法切分 适用场景：门票、会员
    4、abstract virtual
        当合约中存在虚函数，必须在合约前添加abstract关键字
        当合约继承一个抽象合约，且不想该合约变成抽象合约，必须重写抽象合约中的虚函数
        当合约继承一个抽象合约，且抽象合约中的虚函数有函数体，合约可以重写该虚函数，也可以不重写该虚函数
    5、 remix的缺点
        难以进行批量部署和测试
        难以统一版本
 */
