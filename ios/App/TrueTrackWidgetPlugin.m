#import <Capacitor/Capacitor.h>

CAP_PLUGIN(TrueTrackWidgetPlugin, "TrueTrackWidget",
           CAP_PLUGIN_METHOD(testEcho, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(ping, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setWidgetData, CAPPluginReturnPromise);)

void ForceLoadWidgetNative(void) {
  printf("WidgetNative.m: ForceLoadWidgetNative called\n");
}
