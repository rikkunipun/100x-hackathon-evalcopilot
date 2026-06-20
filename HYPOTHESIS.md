Move 2: The Bet

Timestamped before any application code.

The claim

If you hand a builder a golden set and a rubric for their own AI feature, they will find a real failure they did not already know about. This will happen more times than not.

Fraction that proves me right

At least 1 of my 2 builders (User 1 Varun, User 2 Vikrant) has a real LLM-quality failure. Meaning the output is wrong, incomplete, hallucinated, or missing info compared to what they themselves expected. They did not know about this failure before the eval, and they change something real because of it.

Fraction that means I only built a mirror

Both User 1 Varun and User 2 Vikrant get outputs that match their expected outputs cleanly across all 5 cases. The eval just confirms what they already believed about their own feature. Nobody changes anything.

Kill-number

0 of 2 builders have any real model-quality failure. I am not counting infra or API issues here, since that is not what this tool is testing. If this happens, I will write it down honestly: my hypothesis was wrong, forcing a golden set did not surface anything new for either of them.

Why I believe this

Most builders test their AI feature on 2 or 3 happy path inputs they already know will pass. Nobody actually sits down and writes a proper answer key before that. Forcing a written golden set and a rubric, then grading it by hand, should catch at least one real blind spot for most builders.

Timestamp

First commit, before any application code.
