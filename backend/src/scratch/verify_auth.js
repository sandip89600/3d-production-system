/**
 * Verification script for Auth validation routines, password policy guidelines,
 * email verification formats, and user-agent string parser tests.
 */

// Simple tests matching backend authController.js rules

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'yopmail.com', 'tempmail.com', '10minutemail.com',
  'sharklasers.com', 'guerrillamail.com', 'dispostable.com', 'getairmail.com',
  'burnermail.io', 'trashmail.com'
];

const isDisposableEmail = (email = '') => {
  const domain = email.toLowerCase().split('@')[1];
  return DISPOSABLE_DOMAINS.includes(domain);
};

const validateEmail = (email = '') => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid format';
  if (isDisposableEmail(email)) return 'Disposable domain';
  return 'Valid';
};

const validatePassword = (password = '') => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.\-_])[A-Za-z\d@$!%*?&#.\-_]{8,}$/;
  return passwordRegex.test(password);
};

const parseUserAgent = (uaStr = '') => {
  const ua = uaStr.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge') || ua.includes('edg')) browser = 'Edge';

  if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
  else if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';

  return { browser, os, device };
};

// RUN TESTS
console.log('--- Auth System Validation Tests ---');

const testEmails = [
  { email: 'john@gmail.com', expected: 'Valid' },
  { email: 'invalid-email', expected: 'Invalid format' },
  { email: 'user@mailinator.com', expected: 'Disposable domain' }
];

testEmails.forEach(({ email, expected }) => {
  const result = validateEmail(email);
  console.log(`Email [${email}]: Result: "${result}" | Expected: "${expected}" => ${result === expected ? 'PASS' : 'FAIL'}`);
});

const testPasswords = [
  { pwd: 'Short1!', expected: false },
  { pwd: 'NoNumberSpec', expected: false },
  { pwd: 'SecurePassword123!', expected: true },
  { pwd: 'lowercaseonly123!', expected: false }
];

testPasswords.forEach(({ pwd, expected }) => {
  const result = validatePassword(pwd);
  console.log(`Password [${pwd}]: Result: ${result} | Expected: ${expected} => ${result === expected ? 'PASS' : 'FAIL'}`);
});

const uaTests = [
  { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', os: 'Windows', browser: 'Chrome', device: 'Desktop' },
  { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1', os: 'iOS', browser: 'Safari', device: 'Mobile' }
];

uaTests.forEach((t) => {
  const parsed = parseUserAgent(t.ua);
  const pass = parsed.os === t.os && parsed.browser === t.browser && parsed.device === t.device;
  console.log(`UA [${parsed.browser}/${parsed.os}/${parsed.device}]: Expected: [${t.browser}/${t.os}/${t.device}] => ${pass ? 'PASS' : 'FAIL'}`);
});
