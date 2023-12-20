import { PaymentRequestApple, PaymentRequestGoogle } from './PaymentRequest';

export default class PaymentRequestService {
  constructor(...args) {
    this.vendorPaymentRequest = Device.isAndroid ? new PaymentRequestGoogle(...args) : new PaymentRequestApple(...args);
  }

  show(...args) {
    return this.vendorPaymentRequest.show(...args);
  }

  abort() {
    return this.vendorPaymentRequest.abort();
  }

  static setup() {
    return PaymentRequestApple.setup();
  }

  static canMakePayments() {
    return Device.isAndroid ? PaymentRequestGoogle.canMakePayments() : PaymentRequestApple.canMakePayments();
  }

  static canMakePaymentsUsingNetworks() {
    return Device.isAndroid
      ? PaymentRequestGoogle.canMakePaymentsUsingNetworks()
      : PaymentRequestApple.canMakePaymentsUsingNetworks();
  }
}
