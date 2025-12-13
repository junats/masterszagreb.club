#import "App-Swift.h"
#import <Capacitor/Capacitor.h>
#import <Foundation/Foundation.h>
#include <stdio.h>

CAP_PLUGIN(TrueTrackWidgetPlugin, "TrueTrackWidgetPlugin",
           CAP_PLUGIN_METHOD(echo123, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(ping, CAPPluginReturnPromise);
           // CAP_PLUGIN_METHOD(setWidgetData, CAPPluginReturnPromise);
)

void ForceLoadWidgetNative(void) {
  NSLog(@"DIAGNOSTIC RUN: ForceLoadWidgetNative 555");
  printf("DIAGNOSTIC RUN: ForceLoadWidgetNative 555 (printf)\n");

  NSArray *classNames =
      @[ @"TrueTrackWidgetPlugin", @"App.TrueTrackWidgetPlugin" ];

  for (NSString *className in classNames) {
    Class cls = NSClassFromString(className);
    if (cls) {
      NSLog(@"TrueTrackWidgetPlugin.m: Class AND Module FOUND: %@", className);
      id instance = [[cls alloc] init];
      if ([instance respondsToSelector:@selector(ping:)]) {
        NSLog(@"TrueTrackWidgetPlugin.m: Method 'ping:' FOUND on instance");
      } else {
        NSLog(@"TrueTrackWidgetPlugin.m: Method 'ping:' NOT FOUND on instance! "
              @"Check @objc visibility.");
      }

      if ([instance respondsToSelector:@selector(echo123:)]) {
        NSLog(@"TrueTrackWidgetPlugin.m: Method 'echo123:' FOUND on instance");
      } else {
        NSLog(@"TrueTrackWidgetPlugin.m: Method 'echo123:' NOT FOUND on "
              @"instance!");
      }
      return; // Found it, stop searching
    } else {
      NSLog(@"TrueTrackWidgetPlugin.m: Class NOT FOUND: %@", className);
    }
  }
  NSLog(@"DIAGNOSTIC RUN: Finished searching class names.");
}

// __attribute__((constructor)) static void initialize_plugin() {
//   printf("TrueTrackWidgetPlugin.m: Registration Constructor Running! \n");
// }
