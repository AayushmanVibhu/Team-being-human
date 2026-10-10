// Prototype-only boundary. A secure backend must verify university ownership in production.
export const verificationService={
  isSupportedEmail(email){return /^[^\s@]+@[^\s@]+\.edu$/i.test(email.trim())},
  async sendCode(email){if(!this.isSupportedEmail(email))throw new Error('Use a valid university .edu email.');await new Promise(r=>setTimeout(r,450));return {challengeId:`demo-${Date.now()}`,demoCode:'246810'}},
  async verifyCode(_challengeId,code){await new Promise(r=>setTimeout(r,350));return code==='246810'}
};
