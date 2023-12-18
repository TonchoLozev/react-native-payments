/** Code for this module is scrapped from here: https://github.com/naoufal/react-native-payments*/

#import "ReactNativePayments.h"
#import <React/RCTUtils.h>

@implementation ReactNativePayments
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents{
  return @[@"NativePayments:onuseraccept", @"NativePayments:onuserdismiss"];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

- (NSDictionary *)constantsToExport
{
    return @{
             @"canMakePayments": @([PKPaymentAuthorizationViewController canMakePayments]),
             };
}


RCT_EXPORT_METHOD(canMakePaymentsUsingNetworks:
                  (NSArray *)paymentNetworks
                  callback:(RCTResponseSenderBlock)callback)
{
    callback(@[[NSNull null], @([PKPaymentAuthorizationViewController canMakePaymentsUsingNetworks:paymentNetworks])]);
}

RCT_EXPORT_METHOD(createPaymentRequest: (NSDictionary *)methodData
                  details: (NSDictionary *)details
                  callback: (RCTResponseSenderBlock)callback)
{
    NSString *merchantId = methodData[@"merchantIdentifier"];

    self.paymentRequest = [[PKPaymentRequest alloc] init];
    self.paymentRequest.merchantIdentifier = merchantId;
    self.paymentRequest.merchantCapabilities = PKMerchantCapability3DS;
    self.paymentRequest.countryCode = methodData[@"countryCode"];
    self.paymentRequest.currencyCode = methodData[@"currencyCode"];
    self.paymentRequest.supportedNetworks = [self getSupportedNetworksFromMethodData:methodData];
    self.paymentRequest.paymentSummaryItems = [self getPaymentSummaryItemsFromDetails:details];

    callback(@[[NSNull null]]);
}

RCT_EXPORT_METHOD(setup: (RCTResponseSenderBlock)callback)
{
  dispatch_async(dispatch_get_main_queue(), ^{
      PKPassLibrary *passLibrary = [PKPassLibrary new];
      [passLibrary openPaymentSetup];
      callback(@[[NSNull null]]);
  });
}


RCT_EXPORT_METHOD(show: (RCTResponseSenderBlock)callback)
{

    self.viewController = [[PKPaymentAuthorizationViewController alloc] initWithPaymentRequest: self.paymentRequest];
    self.viewController.delegate = self;

    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *rootViewController = RCTPresentedViewController();
        [rootViewController presentViewController:self.viewController animated:YES completion:nil];
        callback(@[[NSNull null]]);
    });
}

RCT_EXPORT_METHOD(abort: (RCTResponseSenderBlock)callback)
{
    [self.viewController dismissViewControllerAnimated:YES completion:nil];

    callback(@[[NSNull null]]);
}

RCT_EXPORT_METHOD(complete: (NSString *)paymentStatus
                  callback: (RCTResponseSenderBlock)callback)
{
    if ([paymentStatus isEqualToString: @"success"]) {
      PKPaymentAuthorizationResult *successResult =
            [[PKPaymentAuthorizationResult alloc] initWithStatus:PKPaymentAuthorizationStatusSuccess
                                                          errors:nil];

        self.completion(successResult);
    } else {
      PKPaymentAuthorizationResult *errorResult =
                [[PKPaymentAuthorizationResult alloc] initWithStatus:PKPaymentAuthorizationStatusFailure
                                                              errors:@[ ]];

        self.completion(errorResult);
    }

    callback(@[[NSNull null]]);
}


-(void) paymentAuthorizationViewControllerDidFinish:(PKPaymentAuthorizationViewController *)controller
{
    [controller dismissViewControllerAnimated:YES completion:nil];
    [self sendEventWithName:@"NativePayments:onuserdismiss" body:nil];
}

// DELEGATES
// ---------------
- (void) paymentAuthorizationViewController:(PKPaymentAuthorizationViewController *)controller
                        didAuthorizePayment:(PKPayment *)payment
                                handler:(void (^)(PKPaymentAuthorizationResult * _Nonnull))completion;
{
    // Store completion for later use
    self.completion = completion;
    [self handleUserAccept:payment paymentToken:nil];
}

// PRIVATE METHODS
// https://developer.apple.com/reference/passkit/pkpaymentnetwork
// ---------------
- (NSArray *_Nonnull)getSupportedNetworksFromMethodData:(NSDictionary *_Nonnull)methodData
{
    NSMutableDictionary *supportedNetworksMapping = [[NSMutableDictionary alloc] init];

    CGFloat iOSVersion = [[[UIDevice currentDevice] systemVersion] floatValue];

    if (iOSVersion >= 8) {
        [supportedNetworksMapping setObject:PKPaymentNetworkAmex forKey:@"amex"];
        [supportedNetworksMapping setObject:PKPaymentNetworkMasterCard forKey:@"mastercard"];
        [supportedNetworksMapping setObject:PKPaymentNetworkVisa forKey:@"visa"];
    }

    if (iOSVersion >= 9) {
        [supportedNetworksMapping setObject:PKPaymentNetworkDiscover forKey:@"discover"];
        [supportedNetworksMapping setObject:PKPaymentNetworkPrivateLabel forKey:@"privatelabel"];
    }

    if (iOSVersion >= 9.2) {
        [supportedNetworksMapping setObject:PKPaymentNetworkChinaUnionPay forKey:@"chinaunionpay"];
        [supportedNetworksMapping setObject:PKPaymentNetworkInterac forKey:@"interac"];
    }

    if (iOSVersion >= 10.1) {
        [supportedNetworksMapping setObject:PKPaymentNetworkJCB forKey:@"jcb"];
        [supportedNetworksMapping setObject:PKPaymentNetworkSuica forKey:@"suica"];
    }

    if (iOSVersion >= 10.3) {
        [supportedNetworksMapping setObject:PKPaymentNetworkCartesBancaires forKey:@"cartebancaires"];
        [supportedNetworksMapping setObject:PKPaymentNetworkIDCredit forKey:@"idcredit"];
        [supportedNetworksMapping setObject:PKPaymentNetworkQuicPay forKey:@"quicpay"];
    }

    if (iOSVersion >= 11) {
        [supportedNetworksMapping setObject:PKPaymentNetworkCartesBancaires forKey:@"cartebancaires"];
    }

    if (iOSVersion >= 12.1) {
        [supportedNetworksMapping setObject:PKPaymentNetworkMada forKey:@"mada"];
    }

    if (iOSVersion >= 12.1) {
        [supportedNetworksMapping setObject:PKPaymentNetworkMada forKey:@"mada"];
    }

    // Setup supportedNetworks
    NSArray *jsSupportedNetworks = methodData[@"supportedNetworks"];
    NSMutableArray *supportedNetworks = [NSMutableArray array];
    for (NSString *supportedNetwork in jsSupportedNetworks) {
        [supportedNetworks addObject: supportedNetworksMapping[supportedNetwork]];
    }

    return supportedNetworks;
}

- (NSArray<PKPaymentSummaryItem *> *_Nonnull)getPaymentSummaryItemsFromDetails:(NSDictionary *_Nonnull)details
{
    // Setup `paymentSummaryItems` array
    NSMutableArray <PKPaymentSummaryItem *> * paymentSummaryItems = [NSMutableArray array];

    // Add `displayItems` to `paymentSummaryItems`
    NSArray *displayItems = details[@"displayItems"];
    if (displayItems.count > 0) {
        for (NSDictionary *displayItem in displayItems) {
            [paymentSummaryItems addObject: [self convertDisplayItemToPaymentSummaryItem:displayItem]];
        }
    }

    // Add total to `paymentSummaryItems`
    NSDictionary *total = details[@"total"];
    [paymentSummaryItems addObject: [self convertDisplayItemToPaymentSummaryItem:total]];

    return paymentSummaryItems;
}

- (PKPaymentSummaryItem *_Nonnull)convertDisplayItemToPaymentSummaryItem:(NSDictionary *_Nonnull)displayItem;
{
    NSDecimalNumber *decimalNumberAmount = [NSDecimalNumber decimalNumberWithString:displayItem[@"amount"][@"value"]];
    PKPaymentSummaryItem *paymentSummaryItem = [PKPaymentSummaryItem summaryItemWithLabel:displayItem[@"label"] amount:decimalNumberAmount];

    return paymentSummaryItem;
}

- (NSDictionary *_Nonnull)paymentMethodToString:(PKPaymentMethod *_Nonnull)paymentMethod
{
    NSMutableDictionary *result = [[NSMutableDictionary alloc]initWithCapacity:4];

    if(paymentMethod.displayName) {
        [result setObject:paymentMethod.displayName forKey:@"displayName"];
    }
    if (paymentMethod.network) {
        [result setObject:paymentMethod.network forKey:@"network"];
    }
    NSString *type = [self paymentMethodTypeToString:paymentMethod.type];
    [result setObject:type forKey:@"type"];
    if(paymentMethod.paymentPass) {
        NSDictionary *paymentPass = [self paymentPassToDictionary:paymentMethod.paymentPass];
        [result setObject:paymentPass forKey:@"paymentPass"];
    }

    return result;
}

- (NSString *_Nonnull)paymentMethodTypeToString:(PKPaymentMethodType)paymentMethodType
{
    NSArray *arr = @[@"PKPaymentMethodTypeUnknown",
                     @"PKPaymentMethodTypeDebit",
                     @"PKPaymentMethodTypeCredit",
                     @"PKPaymentMethodTypePrepaid",
                     @"PKPaymentMethodTypeStore"];
    return (NSString *)[arr objectAtIndex:paymentMethodType];
}

- (NSDictionary *_Nonnull)paymentPassToDictionary:(PKPaymentPass *_Nonnull)paymentPass
{
    return @{
        @"primaryAccountIdentifier" : paymentPass.primaryAccountIdentifier,
        @"primaryAccountNumberSuffix" : paymentPass.primaryAccountNumberSuffix,
        @"deviceAccountIdentifier" : paymentPass.deviceAccountIdentifier,
        @"deviceAccountNumberSuffix" : paymentPass.deviceAccountNumberSuffix,
        @"activationState" : [self paymentPassActivationStateToString:paymentPass.activationState]
    };
}

- (NSString *_Nonnull)paymentPassActivationStateToString:(PKPaymentPassActivationState)paymentPassActivationState
{
    NSArray *arr = @[@"PKPaymentPassActivationStateActivated",
                     @"PKPaymentPassActivationStateRequiresActivation",
                     @"PKPaymentPassActivationStateActivating",
                     @"PKPaymentPassActivationStateSuspended",
                     @"PKPaymentPassActivationStateDeactivated"];
    return (NSString *)[arr objectAtIndex:paymentPassActivationState];
}

- (void)handleUserAccept:(PKPayment *_Nonnull)payment
            paymentToken:(NSString *_Nullable)token
{
    NSMutableDictionary *paymentResponse = [[NSMutableDictionary alloc]initWithCapacity:6];

    NSString *transactionId = payment.token.transactionIdentifier;
    [paymentResponse setObject:transactionId forKey:@"transactionIdentifier"];

    NSString *paymentData = [[NSString alloc] initWithData:payment.token.paymentData encoding:NSUTF8StringEncoding];
    [paymentResponse setObject:paymentData forKey:@"paymentData"];

    NSDictionary *paymentMethod = [self paymentMethodToString:payment.token.paymentMethod];
    [paymentResponse setObject:paymentMethod forKey:@"paymentMethod"];

    if (token) {
        [paymentResponse setObject:token forKey:@"paymentToken"];
    }

    [self sendEventWithName:@"NativePayments:onuseraccept" body:paymentResponse];
}

@end
