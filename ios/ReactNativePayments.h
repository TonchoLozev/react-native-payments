/** Code for this module is scrapped from here: https://github.com/naoufal/react-native-payments*/

@import UIKit;
@import PassKit;
@import AddressBook;

#if __has_include("RCTBridgeModule.h")
#import "RCTBridgeModule.h"
#else
#import <React/RCTBridgeModule.h>
#endif
#import <React/RCTEventEmitter.h>

@interface ReactNativePayments : RCTEventEmitter <RCTBridgeModule, PKPaymentAuthorizationViewControllerDelegate>

NS_ASSUME_NONNULL_BEGIN
@property (nonatomic, strong) RCTResponseSenderBlock callback;
@property (nonatomic, strong) PKPaymentRequest *paymentRequest;
@property (nonatomic, strong) NSDictionary *initialOptions;
@property (nonatomic, strong) PKPaymentAuthorizationViewController *viewController;
@property (nonatomic, copy) void (^completion)(PKPaymentAuthorizationResult *);

NS_ASSUME_NONNULL_END
// Private methods
- (NSArray *_Nonnull)getSupportedNetworksFromMethodData:(NSDictionary *_Nonnull)methodData;
- (NSArray<PKPaymentSummaryItem *> *_Nonnull)getPaymentSummaryItemsFromDetails:(NSDictionary *_Nonnull)details;
- (PKPaymentSummaryItem *_Nonnull)convertDisplayItemToPaymentSummaryItem:(NSDictionary *_Nonnull)displayItem;
- (void)handleUserAccept:(PKPayment *_Nonnull)payment
            paymentToken:(NSString *_Nullable)token;
@end
