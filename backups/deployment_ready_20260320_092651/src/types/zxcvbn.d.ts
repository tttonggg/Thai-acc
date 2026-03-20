declare module 'zxcvbn' {
  export interface ZxcvbnFeedback {
    warning: string;
    suggestions: string[];
  }

  export interface ZxcvbnResult {
    score: number; // 0-4
    feedback: ZxcvbnFeedback;
    crack_times_display: {
      online_throttling_100_per_hour: string;
      online_no_throttling_10_per_second: string;
      offline_slow_hashing_1e4_per_second: string;
      offline_fast_hashing_1e10_per_second: string;
    };
    password: string;
  }

  export default function zxcvbn(password: string): ZxcvbnResult;
}
