import { NativeEventEmitter, NativeModules } from 'react-native';
import PaymentResponse from './PaymentResponse';
const { GooglePayModule, ApplePayModule } = NativeModules;

const VENDOR_CONFIG = {
  MERCHANT_ID: 'merchant.com.test.wallet',
      MERCHANT_ID_DEV: 'merchant.com.test.wallet.sandbox',
      MODULE_SCOPING: 'NativePayments',
      USER_ACCEPT_EVENT: 'NativePayments:onuseraccept',
      MERCHANT_NAME: 'checkoutltd',
      SUPPORTED_NETWORKS_APPLE: ['visa', 'mastercard'],
      SUPPORTED_NETWORKS_GOOGLE: ['MASTERCARD', 'VISA'],
      NAME: 'test',
};

export class PaymentRequestApple {
  constructor(publicKey, countryCode, currencyCode, amount = 0, idempotency_key = null) {
    this._methodData = {
      merchantIdentifier: global.DEV ? VENDOR_CONFIG.MERCHANT_ID_DEV : VENDOR_CONFIG.MERCHANT_ID,
      supportedNetworks: VENDOR_CONFIG.SUPPORTED_NETWORKS_APPLE,
      countryCode,
      currencyCode,
    };

    this._details = {
      total: {
        label: VENDOR_CONFIG.NAME,
        amount: {
          currency: currencyCode,
          value: amount.toString(),
        },
        idempotency_key: idempotency_key,
      },
    };

    this._acceptPromise;
    this._acceptPromiseResolver = () => {};
    this._acceptPromiseRejecter = () => {};
    this._userAcceptSubscription;

    this._setupEventListeners();

    ApplePayModule.createPaymentRequest(this._methodData, this._details, (error) => error && console.warn(error));
  }

  _acceptPromiseResolver = () => {};

  _acceptPromiseRejecter = () => {};

  _setupEventListeners() {
    const eventEmitter = new NativeEventEmitter(ApplePayModule);
    this._userAcceptSubscription = eventEmitter.addListener(
      VENDOR_CONFIG.USER_ACCEPT_EVENT,
      this._handleUserAccept.bind(this),
    );
  }

  _removeEventListeners() {
    this._userAcceptSubscription.remove();
  }

  _handleUserAccept(details) {
    const { transactionIdentifier, paymentData, shippingAddress, payerEmail, paymentToken, paymentMethod } = details;

    const paymentResponse = new PaymentResponse({
      requestId: this.id,
      methodName: 'apple-pay',
      details: {
        paymentData: paymentData,
        billingContact: shippingAddress || null,
        shippingContact: payerEmail || null,
        paymentToken,
        transactionIdentifier,
        paymentMethod,
      },
    });

    return this._acceptPromiseResolver(paymentResponse);
  }

  _closePaymentRequest() {
    this._acceptPromiseRejecter(new Error('AbortError'));

    this._removeEventListeners();
  }

  // NOTE
  // Open card sheet so the user select card and pay
  show() {
    this._acceptPromise = new Promise((resolve, reject) => {
      this._acceptPromiseResolver = resolve;
      this._acceptPromiseRejecter = reject;

      return new Promise((res, rej) => {
        ApplePayModule.show((error, paymentToken) => {
          if (error) {
            return rej(error);
          }

          res(true);
        });
      });
    });

    return this._acceptPromise;
  }

  // NOTE
  // Is used to abort transaction
  abort() {
    return new Promise((res, rej) => {
      ApplePayModule.abort(() => {
        this._closePaymentRequest();

        return res();
      });
    });
  }

  // NOTE
  // Open card sheet so the user can add card
  static setup() {
    return new Promise((res, rej) => {
      ApplePayModule.setup(() => {
        res();
      });
    });
  }

  // NOTE
  // Is used to detect if device is available for apple-pay
  static canMakePayments() {
    return ApplePayModule.canMakePayments;
  }

  // NOTE
  // Is used to detect if device is available for apple-pay and there are available cards
  static canMakePaymentsUsingNetworks() {
    return new Promise((res, rej) => {
      ApplePayModule.canMakePaymentsUsingNetworks(['Visa', 'MasterCard'], (error, data) => res(data));
    });
  }
}

export class PaymentRequestGoogle {
  constructor(publicKey, countryCode, currencyCode, amount = 0, idempotency_key = null) {
    this._methodData = {
      gateway: {
        name: VENDOR_CONFIG.MERCHANT_NAME,
        merchantId: publicKey,
      },
      cardNetworks: VENDOR_CONFIG.SUPPORTED_NETWORKS_GOOGLE,
    };
    this._details = {
      totalPrice: amount.toString(),
      totalPriceStatus: 'FINAL',
      currencyCode,
      idempotency_key: idempotency_key,
    };
  }

  // NOTE
  // Open card sheet so the user select card and pay
  // If canMakePaymentsUsingNetworks is false user will be able to add card withotut making payment
  show(canMakePaymentsUsingNetworks = true) {
    const request = {
      cardPaymentMethodMap: this._methodData,
      transaction: this._details,
      merchantName: VENDOR_CONFIG.NAME,
    };

    return GooglePayModule.requestPayment(
      global.DEV ? GooglePayModule.ENVIRONMENT_TEST : GooglePayModule.ENVIRONMENT_PRODUCTION,
      request,
      canMakePaymentsUsingNetworks,
    );
  }

  // NOTE
  // Is used to detect if device is available for google-pay
  static canMakePayments() {
    return GooglePayModule.possiblyShowGooglePayButton(
      global.DEV ? GooglePayModule.ENVIRONMENT_TEST : GooglePayModule.ENVIRONMENT_PRODUCTION,
      VENDOR_CONFIG.SUPPORTED_NETWORKS_GOOGLE,
      false,
    );
  }

  // NOTE
  // Is used to detect if device is available for google-pay and there are available cards
  static canMakePaymentsUsingNetworks() {
    // NOTE
    // possiblyShowGooglePayButton always returns false in emulators so we hardcode it
    if (global.DEV) {
      return new Promise((res, rej) => {
        res(true);
      });
    }
    return GooglePayModule.possiblyShowGooglePayButton(
      global.DEV ? GooglePayModule.ENVIRONMENT_TEST : GooglePayModule.ENVIRONMENT_PRODUCTION,
      VENDOR_CONFIG.SUPPORTED_NETWORKS_GOOGLE,
      true,
    );
  }
}
