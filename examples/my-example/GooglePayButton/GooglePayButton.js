/** @react **/
import React, { useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

/** @engine **/

/** @dependencies **/
import Config from '../../../../config';
import PaymentRequestService from '../../PaymentRequestService';
import { VendorPaymentService } from '../../service';
import { useCurrency, usePaymentDetails } from '../../../../hooks';
import { useMerchantConfig } from '../../hooks';
import { setPaymentDetails, updateCashbackAmount } from '../../../../state';

/** @components **/
import FailedPayment from '../FailedPayment/FailedPayment';
import PaymentStatusModal from '../PaymentStatusModal/PaymentStatusModal';
import GooglePayLogoLight from '../../../vendor/assets/icons/google-pay-logo-light.svg';
import GooglePayLogoDark from '../../../vendor/assets/icons/google-pay-logo-dark.svg';

/** @ui **/
import { lightStyles, darkStyles } from './GooglePayButton.styles';

const GooglePayButton = ({ componentId, style }) => {
  const isConfirmationSubmitted = useRef(false);

  /** @hooks **/
  const config = useMerchantConfig();
  const paymentDetails = usePaymentDetails();
  const inputCurrency = useCurrency(paymentDetails?.inputCurrencyId);
  const { pop } = Navigator.useNavigation();

  useEventSubscription(
    Config.QUOTE_RESPONSE_EVENTS.PAYMENTS_UPDATE_QUOTE_RESPONSE,
    (response) => (cashbackAmount.current = response.cashbackAmount || 0),
  );

  /** @state **/
  const [buttonState, setButtonState] = useState('default');

  /** @refs **/
  const cashbackAmount = useRef(0);

  /** @constants **/

  const styles = Engine.useTheme().isDark ? darkStyles : lightStyles;
  /** @effects **/

  /** @functions **/
  const handleOnPressIn = useCallback(() => {
    setButtonState('pressed');
  }, [buttonState]);

  const handleOnPressOut = useCallback(() => {
    setButtonState('default');
  }, [buttonState]);

  const onSuccess = (res) => {
    Engine.broadcast(Config.QUOTE_EVENTS.PAYMENTS_STOP_QUOTE);
    Engine.dispatch(setPaymentDetails({ reference: res.reference }));

    if (res['3DSAuthUrl']) {
      Navigator.push(componentId, 'VendorAuthScreen@payments', { url: res['3DSAuthUrl'] });
    } else {
      Engine.alert(
        false,
        <PaymentStatusModal componentId={componentId} />,
        [],
        { cancelable: false },
        'PaymentStatusModal',
      );
    }

    TrackingService.track(TrackingService.event.FORM_SUBMITTED, {
      flow: 'Buy Asset',
      form: 'Confirm Order',
      processor: 'vendor',
      version: 1,
    });
  };

  const onError = (error) => {
    Engine.alert(
      i18n.t('payments.vendor.payment-failed'),
      <FailedPayment errorMessage={error?.message} />,
      [
        {
          text: i18n.t('common.cta-try-again'),
          onPress: () => {
            Navigator.dismissOverlay('FailedPayment');
            Engine.dispatch(setPaymentDetails({ amount: 0 }));
            pop();
          },
        },
      ],
      { cancelable: true },
      'FailedPayment',
    );
  };

  const handleGooglePay = () => {
    if (isConfirmationSubmitted.current) {
      return;
    }

    isConfirmationSubmitted.current = true;

    const publicKey = config?.publicKey;
    const merchantCountryCode = config?.merchantCountryCode;
    const currencyName = inputCurrency?.name;
    const amount = paymentDetails?.amount;
    const idempotency_key = paymentDetails?.idempotency_key;

    if (!publicKey || !merchantCountryCode || !currencyName || !amount) {
      Logger.error(
        `[PAYMENT-METHODS] handleGooglePay is called without correct arguments: ${publicKey}, ${merchantCountryCode}, ${currencyName}, ${amount}`,
      );
      return;
    }

    const paymentRequest = new PaymentRequestService(publicKey, merchantCountryCode, currencyName, amount, idempotency_key);

    paymentRequest
      .show()
      .then((token) => {
        const resp = JSON.parse(token);

        VendorPaymentService.requestMobilePayment({
          type: 'googlepay',
          token_data: {
            protocolVersion: resp.protocolVersion,
            signature: resp.signature,
            signedMessage: resp.signedMessage,
          },
          amount: Number(paymentDetails.amount),
          currency_id: Number(paymentDetails?.inputCurrencyId),
          ...(config.autoCapturePaymentEnabled && { output_currency_id: paymentDetails?.outputCurrencyId }),
          idempotency_key: paymentDetails?.idempotency_key,
        })
          .then(onSuccess)
          .catch(onError);
      })
      .catch((error) => {
        if (error.message.includes('payment has been canceled')) {
          return;
        }

        onError({ message: i18n.t('something-went-wrong') });
      });
  };

  return (
    <Button
      onPress={handleGooglePay}
      onPressOut={handleOnPressOut}
      onPressIn={handleOnPressIn}
      style={[styles.default, styles[buttonState], style]}
      testID="payment.vendor.google-pay-button"
    >
      <View style={styles.container}>
        {i18n.if('payments.google-pay-cta-text') ? (
          <Text center style={styles.text} bold variant="xl2" color="white">
            {i18n.t('payments.google-pay-cta-text')}
          </Text>
        ) : null}
        {Engine.useTheme().isDark ? (
          <GooglePayLogoDark style={styles.image} width={60} />
        ) : (
          <GooglePayLogoLight style={styles.image} width={60} />
        )}
      </View>
    </Button>
  );
};
/** @props **/
GooglePayButton.propTypes = {
  componentId: PropTypes.string,
  style: PropTypes.object,
};
GooglePayButton.defaultProps = {};
export default GooglePayButton;
