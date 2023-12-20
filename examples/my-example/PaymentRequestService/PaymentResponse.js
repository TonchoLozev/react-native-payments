import { NativeModules } from 'react-native';

const { ApplePayModule } = NativeModules;

export default class PaymentResponse {
  constructor(paymentResponse) {
    // Set properties as readOnly
    this._requestId = paymentResponse.requestId;
    this._methodName = paymentResponse.methodName;
    this._details = paymentResponse.details;

    // Internal Slots
    this._completeCalled = false;
  }

  // https://www.w3.org/TR/payment-request/#requestid-attribute
  get requestId() {
    return this._requestId;
  }

  // https://www.w3.org/TR/payment-request/#methodname-attribute
  get methodName() {
    return this._methodName;
  }

  // https://www.w3.org/TR/payment-request/#details-attribute
  get details() {
    return this._details;
  }

  // https://www.w3.org/TR/payment-request/#complete-method
  complete(paymentStatus) {
    if (this._completeCalled === true) {
      throw new Error('InvalidStateError');
    }

    this._completeCalled = true;

    return new Promise((resolve, reject) => {
      return new Promise((resolve, reject) => {
        ApplePayModule.complete(paymentStatus, (error) => {
          if (error) {
            return reject(error);
          }

          resolve(true);
        });
      });
    });
  }
}
