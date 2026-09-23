import http from 'k6/http';
import { check, sleep } from 'k6';

// 500 virtual users browsing the public listings feed.
// The API rate-limits each IP to 100 requests/minute unless the process
// is started with a higher THROTTLE_LIMIT. Raise it for this run so the
// result is handler latency, not a wall of 429s:
//   THROTTLE_LIMIT=100000 npm run start:dev
export const options = {
  scenarios: {
    browse_listings: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 500 },
        { duration: '40s', target: 500 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{endpoint:listings_all}': ['p(95)<1000'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/listings/all`, {
    tags: { endpoint: 'listings_all' },
  });

  check(res, {
    'listings status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
