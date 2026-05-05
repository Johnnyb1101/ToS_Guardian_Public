// TOS Guardian — Evaluator Agent
// Scores Analyzer output quality before it reaches the UI.

const HEDGE_PHRASES = [
  'not specified', 'not mentioned', 'not found', 'unclear',
  'could not', 'unable to', 'no information', 'not available',
  'not provided', 'not stated', 'not addressed',
  'does not mention', 'does not specify', 'not explicitly'
];

const MIN_CREDIBLE_LENGTH = 300;

function evaluateAnalysis(analysisText) {
  if (!analysisText || typeof analysisText !== 'string') {
    return {
      score: 0,
      label: 'Failed',
      warning: '⚠️ No analysis was returned. The legal document may not have loaded correctly.',
      passed: false,
      escalate: true
    };
  }

  const text = analysisText.toLowerCase();
  let score = 100;
  const issues = [];

  // Check 1: Is the response long enough to be credible?
  if (analysisText.length < MIN_CREDIBLE_LENGTH) {
    score -= 40;
    issues.push('response too short');
  }

  // Check 2: How many hedge phrases appear?
  let hedgeCount = 0;
  for (const phrase of HEDGE_PHRASES) {
    if (text.includes(phrase)) hedgeCount++;
  }
  const hedgeDensity = hedgeCount / Math.max(1, analysisText.length / 100);
  if (hedgeDensity > 1.5) {
    score -= 25;
    issues.push('high hedge density — content may not have been retrieved');
  } else if (hedgeDensity > 0.8) {
    score -= 10;
    issues.push('moderate hedge phrases detected');
  }

  // Check 3: Did any upstream fetch errors bleed into the output?
  const errorPatterns = ['fetch failed', 'error:', '[error]', 'timed out', 'could not fetch'];
  for (const pattern of errorPatterns) {
    if (text.includes(pattern)) {
      score -= 20;
      issues.push('upstream fetch error detected in output');
      break;
    }
  }

  score = Math.max(0, Math.min(100, score));

  // Thresholds per ESCALATION-001
  // Strong = 95+, Adequate = 75-94, Failed = below 75
  let label;
  if (score >= 95)      label = 'Strong';
  else if (score >= 75) label = 'Adequate';
  else                  label = 'Failed';

  let warning = null;
  if (label === 'Failed') {
    warning = '⚠️ Analysis failed — the legal document may not have loaded. Try reloading the page and clicking the button again.';
  } else if (label === 'Adequate') {
    warning = '⚠️ Partial analysis — some sections could not be fully assessed. Use this as a starting point, not a complete review.';
  }

  // escalate flag — read by Orchestrator to trigger Opus retry (ESCALATION-002)
  // Failed always escalates. Adequate escalates unless session cap is hit.
  const escalate = label === 'Failed' || label === 'Adequate';
  const passed = label === 'Strong' || label === 'Adequate';

  console.log(`[Evaluator] Score: ${score} | Label: ${label} | Issues: ${issues.join(', ') || 'none'}`);

  return { score, label, warning, passed, escalate };
}