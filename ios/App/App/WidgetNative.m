
#import <Capacitor/Capacitor.h>
#import <Foundation/Foundation.h>

// Forward declare the Swift class to avoid importing App-Swift.h (which causes
// conflicts)
@class TrueTrackWidgetImplementation;

CAP_PLUGIN(TrueTrackWidgetImplementation, "TrueTrackWidget",
           CAP_PLUGIN_METHOD(testEcho, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(ping, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setWidgetData, CAPPluginReturnPromise);)

// DEBUG: Verify file load
__attribute__((constructor)) static void widgetNativeLoader() {
  printf("WidgetNative.m: [C] Constructor called - File loaded!\n");
}
