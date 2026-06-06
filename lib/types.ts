export type Category = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type Attachment = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  url?: string;
};

export type Question = {
  id: string;
  body: string;
  author: string | null;
  votes: number;
  pinned: boolean;
  category: Category | null;
  attachments: Attachment[];
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  question_id: string | null;
  read: boolean;
  created_at: string;
};

export type LeaderboardEntry = {
  author: string;
  questions: number;
  total_votes: number;
  score: number;
};

export type ReportSummary = {
  total_questions: number;
  total_votes: number;
  total_attachments: number;
  pinned_count: number;
  by_category: { name: string; slug: string; color: string; count: number }[];
  top_questions: { id: string; body: string; author: string | null; votes: number }[];
};
