import React from 'react';

import { act, fireEvent } from '@testing-library/react-native';

import ApplePaySetupButton from './ApplePaySetupButton';

import PaymentRequestService from '../../PaymentRequestService';

import { renderWithProviders } from '../../../../../../.testing/utils/renderWithProviders.js';
import paymentsState from '../../../../../jest/__mocks__/state';

const setup = (errorMessage) => {
  const testID = 'payment.vendor.apple-pay-setup-button';

  const Component = <ApplePaySetupButton style={{}} componentId="test" />;
  const component = renderWithProviders(Component, { payments: paymentsState });

  return {
    snap: () => component.toJSON(),
    result: () => component.getByTestId(testID),
  };
};

const mockWithCorrectParameters = () => {
  const mockSetup = jest.fn().mockImplementation(
    () =>
      new Promise((res, rej) => {
        res({});
      }),
  );
  jest.spyOn(PaymentRequestService, 'setup').mockImplementation(mockSetup);

  return {
    mockSetup,
  };
};

describe('ApplePaySetupButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should create a napshot', () => {
    const { snap } = setup();

    expect(snap()).toMatchSnapshot();
  });

  describe('Given correct parameters', () => {
    describe('When onPress is fired', () => {
      test('Then it must call setup method', async () => {
        const { mockSetup } = mockWithCorrectParameters();

        const { result } = setup();

        await act(() => {
          fireEvent.press(result());
        });

        expect(mockSetup).toHaveBeenCalled();
      });
    });
  });
});
