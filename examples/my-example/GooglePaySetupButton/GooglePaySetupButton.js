/** @react **/
import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

/** @engine **/
/** @dependencies **/
import PaymentRequestService from '../../PaymentRequestService';
import { useCurrency } from '../../../../hooks';
import { useMerchantConfig } from '../../hooks';

/** @components **/
import GooglePayLogoLight from '../../../vendor/assets/icons/google-pay-logo-light.svg';
import GooglePayLogoDark from '../../../vendor/assets/icons/google-pay-logo-dark.svg';

/** @ui **/
import { lightStyles, darkStyles } from './GooglePaySetupButton.styles';

const GooglePaySetupButton = ({ style, inputCurrencyId }) => {
  /** @hooks **/
  const config = useMerchantConfig();
  const inputCurrency = useCurrency(inputCurrencyId);

  /** @state **/
  const [buttonState, setButtonState] = React.useState('default');

  /** @refs **/

  /** @constants **/

  const styles = Engine.useTheme().isDark ? darkStyles : lightStyles;
  /** @effects **/

  /** @functions **/
  const handleOnPressIn = React.useCallback(() => {
    setButtonState('pressed');
  }, [buttonState]);

  const handleOnPressOut = React.useCallback(() => {
    setButtonState('default');
  }, [buttonState]);

  const onError = (error) => Engine.alert(null, i18n.t(error.message, error.params));

  const handleGooglePaySetup = () => {
    const publicKey = config?.publicKey;
    const merchantCountryCode = config?.merchantCountryCode;
    const currencyName = inputCurrency?.name;

    if (!publicKey || !merchantCountryCode || !currencyName) {
      Logger.error(
        `[PAYMENT-METHODS] handleGooglePay setup is called without correct arguments: ${publicKey}, ${merchantCountryCode}, ${currencyName}`,
      );
      return;
    }

    const paymentRequest = new PaymentRequestService(publicKey, merchantCountryCode, currencyName, 0);

    // NOTE
    // Google does not provide us a method that is dedicated to just creating/adding a card
    // So we use show(which is for making a payment) and then aborting the payment through the process
    paymentRequest
      .show(false)
      .then(() => console.log('GOOGLE PAY SETUP SUCCESS'))
      .catch((error) => {
        if (error.message.includes('payment has been canceled')) {
          return;
        }

        onError({ message: i18n.t('something-went-wrong') });
      });
  };

  return (
    <Button
      onPress={handleGooglePaySetup}
      onPressOut={handleOnPressOut}
      onPressIn={handleOnPressIn}
      style={[styles.default, styles[buttonState], style]}
      testID="payment.vendor.google-pay-setup-button"
    >
      <View style={styles.container}>
        {i18n.if('payments.google-pay-cta-text') ? (
          <Text center style={styles.text} bold variant="xl2" color="white">
            {i18n.t('payments.google-pay-setup-cta-text')}
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
GooglePaySetupButton.propTypes = {
  componentId: PropTypes.string,
  style: PropTypes.object,
  inputCurrencyId: PropTypes.number,
};
GooglePaySetupButton.defaultProps = {};
export default GooglePaySetupButton;
