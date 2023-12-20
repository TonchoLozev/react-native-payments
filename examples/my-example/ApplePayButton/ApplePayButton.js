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
import PaymentStatusModal from '../PaymentStatusModal/PaymentStatusModal';
/** @ui **/
import { lightStyles, darkStyles } from './ApplePayButton.styles';
import ApplePayLogoLight from '../../../vendor/assets/icons/apple-pay-logo-light.svg';
import ApplePayLogoDark from '../../../vendor/assets/icons/apple-pay-logo-dark.svg';
import FailedPayment from '../FailedPayment/FailedPayment';

const ApplePayButton = ({ componentId, style }) => {
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

  const handleApplePay = () => {
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
        `[PAYMENT-METHODS] handleApplePay is called without correct arguments: ${publicKey}, ${merchantCountryCode}, ${currencyName}, ${amount}`,
      );
      return;
    }

    const paymentRequest = new PaymentRequestService(publicKey, merchantCountryCode, currencyName, amount, idempotency_key);

    paymentRequest
      .show()
      .then((paymentResponse) => {
        const resp = JSON.parse(paymentResponse.details.paymentData);

        VendorPaymentService.requestMobilePayment({
          type: 'applepay',
          token_data: {
            version: resp.version,
            data: resp.data,
            signature: resp.signature,
            header: resp.header,
          },
          amount: Number(paymentDetails.amount),
          currency_id: Number(paymentDetails?.inputCurrencyId),
          ...(config.autoCapturePaymentEnabled && { output_currency_id: paymentDetails?.outputCurrencyId }),
          idempotency_key: paymentDetails?.idempotency_key,
        })
          .then(onSuccess)
          .catch(onError);

        paymentResponse.complete(Config.EXCHANGE_CARD_PAYMENT_STATUSES.SUCCESS);
      })
      .catch((error) => {
        paymentRequest.abort().then(() => {
          onError({ message: i18n.t('common.err-generic-error') });
        });
      });
  };

  return (
    <Button
      onPress={handleApplePay}
      onPressOut={handleOnPressOut}
      onPressIn={handleOnPressIn}
      style={[styles.default, styles[buttonState], style]}
      testID="payment.vendor.apple-pay-button"
    >
      <View style={styles.container}>
        {i18n.if('payments.apple-pay-cta-text') ? (
          <Text center style={styles.text} bold variant="xl2" color="white">
            {i18n.t('payments.apple-pay-cta-text')}
          </Text>
        ) : null}
        {Engine.useTheme().isDark ? (
          <ApplePayLogoDark style={styles.image} width={60} />
        ) : (
          <ApplePayLogoLight style={styles.image} width={60} />
        )}
      </View>
    </Button>
  );
};
/** @props **/
ApplePayButton.propTypes = {
  componentId: PropTypes.string,
  style: PropTypes.object,
};
ApplePayButton.defaultProps = {};
export default ApplePayButton;
