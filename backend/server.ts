import express, { Request, Response, Application } from "express";
import cors from "cors";
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config(); // .env 환경 변수 로드

const app: Application = express(); // ✅ Application 타입 지정
app.use(express.json()); // JSON 요청을 처리하기 위한 미들웨어 추가
app.use(cors());

// 🔹 Redis 클라이언트 설정 (비밀번호 포함)
const redisClient = createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`, // Redis 인증 추가
});

redisClient.on("error", (err) => console.error("Redis error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
})();

// 🔹 요청 데이터 타입 정의
interface TrackActiveUsersRequest {
  sellerId: string;
  sessionId: string;
}

// 🔹 방문자 추적 API (타입 오류 해결)
app.post(
  "/track-active-users",
  async (req: Request<{}, {}, TrackActiveUsersRequest>, res: Response): Promise<void> => {
    try {
      const { sellerId, sessionId } = req.body;

      // 🔹 요청 데이터 유효성 검사
      if (typeof sellerId !== "string" || typeof sessionId !== "string") {
        res.status(400).json({ error: "Invalid sellerId or sessionId" });
        return;
      }

      const now = Math.floor(Date.now() / 1000); // 현재 타임스탬프 (초 단위)

      // 🔹 Redis ZSET에 추가 (배열 형식 사용)
      await redisClient.zAdd(`active_users:${sellerId}`, [
        { score: now, value: sessionId },
      ]);

      res.json({ message: "User tracked successfully" });
    } catch (error) {
      console.error("❌ Error tracking active users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// 🔹 요청 데이터 타입 정의
interface SellerRequest {
  sellerId: string;
}

// 🔹 최근 30분 내 접속 유저 가져오는 API
app.get("/active-users/:sellerId", async (req: Request<SellerRequest>, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      res.status(400).json({ error: "Missing sellerId" });
      return;
    }

    const now = Math.floor(Date.now() / 1000); // 현재 타임스탬프 (초 단위)
    const cutoffTime = now - 1800; // 30분 전 시간 계산

    // 🔹 1️⃣ 30분이 지난 유저 삭제
    await redisClient.zRemRangeByScore(`active_users:${sellerId}`, 0, cutoffTime);

    // 🔹 2️⃣ 최근 30분 내 접속한 유저 목록 가져오기
    const activeUsers = await redisClient.zRangeByScore(`active_users:${sellerId}`, cutoffTime, now);

    res.json({ sellerId, activeUsers, count: activeUsers.length });
  } catch (error) {
    console.error("❌ Error fetching active users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});