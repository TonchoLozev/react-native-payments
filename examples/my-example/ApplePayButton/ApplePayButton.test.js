import React from 'react';

import { act, fireEvent } from '@testing-library/react-native';

import ApplePayButton from './ApplePayButton';

import { VendorPaymentService } from '../../service';
import * as PaymentRequestService from '../../PaymentRequestService';
import * as VendorHooks from '../../hooks';
import * as Hooks from '../../../../hooks';
import * as useCurrency from '../../../../hooks/useCurrency';

import { renderWithProviders } from '../../../../../../.testing/utils/renderWithProviders.js';
import paymentsState from '../../../../../jest/__mocks__/state';
import { currencies } from '../../../../../jest/__mocks__';

const setup = (errorMessage) => {
  const testID = 'payment.vendor.apple-pay-button';

  const Component = <ApplePayButton style={{}} componentId="test" />;
  const component = renderWithProviders(Component, { payments: paymentsState });

  return {
    snap: () => component.toJSON(),
    result: () => component.getByTestId(testID),
  };
};

const mockWithWrongParameters = () => {
  const mockUseCurrency = jest.fn().mockImplementationOnce(() => ({}));
  jest.spyOn(useCurrency, 'default').mockImplementationOnce(mockUseCurrency);

  const mockUsePaymentDetails = jest.fn().mockImplementationOnce(() => ({}));
  jest.spyOn(Hooks, 'usePaymentDetails').mockImplementationOnce(mockUsePaymentDetails);

  const mockUserMerchantConfig = jest.fn().mockImplementationOnce(() => ({}));
  jest.spyOn(VendorHooks, 'useMerchantConfig').mockImplementationOnce(mockUserMerchantConfig);

  return {
    mockUseCurrency,
    mockUsePaymentDetails,
    mockUserMerchantConfig,
  };
};

const mockWithCorrectParameters = () => {
  const mockUseCurrency = jest.fn().mockImplementation(() => currencies[70]);
  jest.spyOn(useCurrency, 'default').mockImplementation(mockUseCurrency);

  const mockShow = jest.fn().mockImplementation(
    () =>
      new Promise((res, rej) => {
        const data = {
          details: {
            paymentData: JSON.stringify({
              version: 'test',
              data: 'test',
              signature: 'test',
              header: 'test',
            }),
          },
        };
        res(data);
      }),
  );
  jest.spyOn(PaymentRequestService, 'default').mockImplementation(() => ({
    show: mockShow,
  }));

  const mockRequestMobilePayment = jest.fn().mockImplementation(
    () =>
      new Promise((res, rej) => {
        res({});
      }),
  );

  jest.spyOn(VendorPaymentService, 'requestMobilePayment').mockImplementation(mockRequestMobilePayment);

  return {
    mockShow,
    mockUseCurrency,
    mockRequestMobilePayment,
  };
};

describe('ApplePayButton', () => {
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
          '[PAYMENT-METHODS] handleApplePay is called without correct arguments: undefined, undefined, undefined, undefined',
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

      test('Then it must call requestMobilePayment service', async () => {
        const { mockRequestMobilePayment } = mockWithCorrectParameters();

        const { result } = setup();

        await act(() => {
          fireEvent.press(result());
        });

        expect(mockRequestMobilePayment).toHaveBeenCalled();
      });
    });
  });
});
