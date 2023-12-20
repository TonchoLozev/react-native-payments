/** @react **/
import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
/** @engine **/

/** @dependencies **/
import PaymentRequestService from '../../PaymentRequestService';

/** @components **/

/** @ui **/
import { lightStyles, darkStyles } from './ApplePaySetupButton.styles';
import ApplePayLogoLight from '../../../vendor/assets/icons/apple-pay-logo-light.svg';
import ApplePayLogoDark from '../../../vendor/assets/icons/apple-pay-logo-dark.svg';

const ApplePaySetupButton = ({ style }) => {
  /** @hooks **/

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
  const handleApplePaySetup = () => {
    PaymentRequestService.setup()
      .then(() => console.log('APPLE PAY SETUP SUCCESS'))
      .catch(() => console.log('APPLE PAY SETUP FAIL'));
  };

  return (
    <Button
      onPress={handleApplePaySetup}
      onPressOut={handleOnPressOut}
      onPressIn={handleOnPressIn}
      style={[styles.default, styles[buttonState], style]}
      testID="payment.vendor.apple-pay-setup-button"
    >
      <View style={styles.container}>
        {i18n.if('payments.apple-pay-cta-text') ? (
          <Text center style={styles.text} bold variant="xl2" color="white">
            {i18n.t('payments.apple-pay-setup-cta-text')}
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
ApplePaySetupButton.propTypes = {
  componentId: PropTypes.string,
  style: PropTypes.object,
};
ApplePaySetupButton.defaultProps = {};
export default ApplePaySetupButton;
