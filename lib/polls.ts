export type Poll = {
  id: string;
  title: string;
  created_at: string;
};

export type PollOption = {
  id: string;
  poll_id: string;
  option_text: string;
};

export type PollVote = {
  id: string;
  poll_id: string;
  option_id: string;
  voter_id: string;
};