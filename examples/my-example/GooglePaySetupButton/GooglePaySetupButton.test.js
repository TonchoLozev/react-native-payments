import React from 'react';

import { act, fireEvent } from '@testing-library/react-native';

import GooglePaySetupButton from './GooglePaySetupButton';

import * as PaymentRequestService from '../../PaymentRequestService';
import * as VendorHooks from '../../hooks';
import * as useCurrency from '../../../../hooks/useCurrency';

import { renderWithProviders } from '../../../../../../.testing/utils/renderWithProviders.js';
import paymentsState from '../../../../../jest/__mocks__/state';
import { currencies } from '../../../../../jest/__mocks__';

const setup = (errorMessage) => {
  const testID = 'payment.vendor.google-pay-setup-button';

  const Component = <GooglePaySetupButton style={{}} componentId="test" />;
  const component = renderWithProviders(Component, { payments: paymentsState });

  return {
    snap: () => component.toJSON(),
    result: () => component.getByTestId(testID),
  };
};

const mockWithWrongParameters = () => {
  const mockUseCurrency = jest.fn().mockImplementationOnce(() => ({}));
  jest.spyOn(useCurrency, 'default').mockImplementationOnce(mockUseCurrency);

  const mockUserMerchantConfig = jest.fn().mockImplementationOnce(() => ({}));
  jest.spyOn(VendorHooks, 'useMerchantConfig').mockImplementationOnce(mockUserMerchantConfig);

  return {
    mockUseCurrency,
    mockUserMerchantConfig,
  };
};

const mockWithCorrectParameters = () => {
  const mockUseCurrency = jest.fn().mockImplementation(() => currencies[70]);
  jest.spyOn(useCurrency, 'default').mockImplementation(mockUseCurrency);

  const mockShow = jest.fn().mockImplementation(
    () =>
      new Promise((res, rej) => {
        res('{"token": "test"}');
      }),
  );
  jest.spyOn(PaymentRequestService, 'default').mockImplementation(() => ({
    show: mockShow,
  }));

  return {
    mockShow,
    mockUseCurrency,
  };
};

describe('GooglePaySetupButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should create a napshot', () => {
    const { snap } = setup();

    expect(snap()).toMatchSnapshot();
  });

  describe('Given wrong parameters', () => {
    describe('When onPress is fired', () => {
      test('Then it must log an error', async () => {
        mockWithWrongParameters();

        const { result } = setup();

        await act(() => {
          fireEvent.press(result());
        });

        expect(global.Logger.error).toHaveBeenCalledWith(
          '[PAYMENT-METHODS] handleGooglePay setup is called without correct arguments: undefined, undefined, undefined',
        );
      });
    });
  });

  describe('Given correct parameters', () => {
    describe('When onPress is fired', () => {
      test('Then it must call show method', async () => {
        const { mockShow } = mockWithCorrectParameters();

        const { result } = setup();

        await act(() => {
          fireEvent.press(result());
        });

        expect(mockShow).toHaveBeenCalled();
      });
    });
  });
});
