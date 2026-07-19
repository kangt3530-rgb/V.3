export interface ChatChip {
  label: string;
  message: string;
}

export const CRITERION_CHIPS: ChatChip[] = [
  {
    label: "Explain this feedback",
    message:
      "Explain what the reviewer is saying about this criterion in simple terms. What are the key issues they identified?",
  },
  {
    label: "What should I change?",
    message:
      "Based on the reviewer's feedback on this criterion, what specific changes should I make to my OER? Give me concrete action items.",
  },
  {
    label: "Help me phrase my log",
    message:
      "I need help phrasing my revision log for this criterion. I want to describe what I changed clearly and concisely. Can you help me structure my notes?",
  },
];

export const GENERAL_CHIPS: ChatChip[] = [
  {
    label: "Summarize all feedback",
    message:
      "Summarize the key themes across all criteria in this accessibility review. What are the most important things I need to address?",
  },
  {
    label: "What's most urgent?",
    message:
      "Looking at all the needs-improvement criteria, which issues should I prioritize fixing first and why?",
  },
  {
    label: "How am I doing?",
    message:
      "Based on the review results, give me an honest overall assessment. What are my strengths and where do I need the most work?",
  },
];
