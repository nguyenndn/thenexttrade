import http from 'k6/http';
import { sleep, check } from 'k6';

// ─── Scenarios & Load Configuration ──────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp-up: từ 0 lên 100 VUs (Virtual Users) trong 30s
    { duration: '1m', target: 500 },   // Ramp-up tiếp: từ 100 lên 500 VUs trong 1 phút
    { duration: '2m', target: 1000 },  // Peak load: Giữ ổn định ở mức 1000 VUs trong 2 phút
    { duration: '30s', target: 0 },    // Ramp-down: giảm dần về 0 VUs trong 30s
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Tỉ lệ lỗi HTTP request phải dưới 1%
    http_req_duration: ['p(95)<1500'], // 95% request phải có phản hồi (response time) dưới 1.5s
  },
};

// Mặc định chạy thử trên localhost:3000 (Có thể đổi sang domain production khi cần)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// ─── Test Script ─────────────────────────────────────────────────────────────
export default function () {
  // 1. Giả lập truy cập Trang chủ (Homepage)
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loaded quickly': (r) => r.timings.duration < 2000,
  });
  sleep(1); // Nghỉ 1 giây giống hành vi người dùng thật trước khi chuyển trang

  // 2. Giả lập truy cập Trang Get Started
  const getStartedRes = http.get(`${BASE_URL}/get-started`);
  check(getStartedRes, {
    'get-started status is 200': (r) => r.status === 200,
    'get-started loaded quickly': (r) => r.timings.duration < 2000,
  });
  sleep(2);

  // 3. Giả lập gọi API Health Check (Kiểm tra tải của backend API)
  const healthRes = http.get(`${BASE_URL}/api/v1/ai/health`);
  check(healthRes, {
    'api health status is 200': (r) => r.status === 200,
    'api health returns ok': (r) => {
      try {
        return JSON.parse(r.body).status === 'ok';
      } catch (e) {
        return false;
      }
    },
  });
  sleep(1);
}
