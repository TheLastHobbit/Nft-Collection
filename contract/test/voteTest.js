const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketVoting", function () {
  let NFTMarketVoting, voting, owner, addr1, addr2, addr3, addr4;
  const TOKEN_ID = 1;

  beforeEach(async function () {
    // 获取合约工厂和签名者
    NFTMarketVoting = await ethers.getContractFactory("NFTMarketVoting");
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    // 部署合约
    voting = await NFTMarketVoting.deploy();
  });

  describe("createVoteRequest", function () {
    it("should create a vote request successfully", async function () {
      // 创建投票请求
      const tx = await voting.connect(owner).createVoteRequest(TOKEN_ID);
      const receipt = await tx.wait();

      // 使用事件解析器检查事件
      const event = receipt.logs
        .map((log) => voting.interface.parseLog(log))
        .find((e) => e && e.name === "VoteRequestCreated");
      expect(event).to.exist;
      expect(event.args.requestId).to.equal(1);
      expect(event.args.tokenId).to.equal(TOKEN_ID);
      expect(event.args.requester).to.equal(owner.address);

      // 检查投票状态
      const status = await voting.getVoteStatus(1);
      expect(status.tokenId).to.equal(TOKEN_ID);
      expect(status.requester).to.equal(owner.address);
      expect(status.voteCount).to.equal(0);
      expect(status.approveCount).to.equal(0);
      expect(status.result).to.equal(0); // Pending
    });
  });

  describe("vote", function () {
    it("should allow voting and finalize with approval", async function () {
      // 创建投票请求
      await voting.connect(owner).createVoteRequest(TOKEN_ID);

      // 三名不同用户投票（两票赞同）
      await expect(voting.connect(addr1).vote(1, true)).to.emit(voting, "Voted").withArgs(1, addr1.address, true);
      await expect(voting.connect(addr2).vote(1, true)).to.emit(voting, "Voted").withArgs(1, addr2.address, true);
      await expect(voting.connect(addr3).vote(1, false))
        .to.emit(voting, "Voted").withArgs(1, addr3.address, false)
        .to.emit(voting, "VoteFinalized").withArgs(1, 1); // Approved

      // 检查投票状态
      const status = await voting.getVoteStatus(1);
      expect(status.voteCount).to.equal(3);
      expect(status.approveCount).to.equal(2);
      expect(status.result).to.equal(1); // Approved
    });

    it("should reject if less than 2 approvals", async function () {
      // 创建投票请求
      await voting.connect(owner).createVoteRequest(TOKEN_ID);

      // 三名用户投票（一票赞同）
      await voting.connect(addr1).vote(1, true);
      await voting.connect(addr2).vote(1, false);
      await voting.connect(addr3).vote(1, false);

      // 检查投票状态
      const status = await voting.getVoteStatus(1);
      expect(status.voteCount).to.equal(3);
      expect(status.approveCount).to.equal(1);
      expect(status.result).to.equal(2); // Rejected
    });

    it("should revert if requester tries to vote", async function () {
      // 创建投票请求
      await voting.connect(owner).createVoteRequest(TOKEN_ID);

      // 请求者尝试投票
      await expect(
        voting.connect(owner).vote(1, true)
      ).to.be.revertedWith("Requester cannot vote");
    });

    it("should revert if user votes twice", async function () {
      // 创建投票请求
      await voting.connect(owner).createVoteRequest(TOKEN_ID);

      // addr1第一次投票
      await voting.connect(addr1).vote(1, true);

      // addr1尝试再次投票
      await expect(
        voting.connect(addr1).vote(1, true)
      ).to.be.revertedWith("Already voted");
    });

    it("should revert if voting on invalid request", async function () {
      // 尝试对不存在的requestId投票
      await expect(
        voting.connect(addr1).vote(999, true)
      ).to.be.revertedWith("Invalid request ID");
    });

    it("should revert if voting on finalized request", async function () {
      // 创建投票请求
      await voting.connect(owner).createVoteRequest(TOKEN_ID);

      // 三名用户投票完成
      await voting.connect(addr1).vote(1, true);
      await voting.connect(addr2).vote(1, true);
      await voting.connect(addr3).vote(1, false);

      // 尝试再次投票
      await expect(
        voting.connect(addr4).vote(1, true)
      ).to.be.revertedWith("Voting has ended");
    });
  });

  describe("getVoteStatus", function () {
    it("should return correct vote status", async function () {
      // 创建投票请求
      await voting.connect(owner).createVoteRequest(TOKEN_ID);

      // 两名用户投票
      await voting.connect(addr1).vote(1, true);
      await voting.connect(addr2).vote(1, false);

      // 检查状态
      const status = await voting.getVoteStatus(1);
      expect(status.tokenId).to.equal(TOKEN_ID);
      expect(status.requester).to.equal(owner.address);
      expect(status.voteCount).to.equal(2);
      expect(status.approveCount).to.equal(1);
      expect(status.result).to.equal(0); // Pending
    });
  });
});