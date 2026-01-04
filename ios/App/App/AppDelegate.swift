import UIKit
import Capacitor
import WidgetKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        print("✅ AppDelegate: App launched")
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // App is about to become inactive
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        print("🔄 AppDelegate: App entered background - copying data to widget")
        
        // Try to find widget data with multiple possible keys
        // @capacitor/preferences might prefix with "CapacitorStorage." or use raw key depending on configuration
        let possibleKeys = ["CapacitorStorage.widgetData", "widgetData"]
        var widgetData: String?
        
        for key in possibleKeys {
            if let data = UserDefaults.standard.string(forKey: key) {
                widgetData = data
                print("📝 AppDelegate: Found widgetData with key: \(key)")
                break
            }
        }
        
        if let data = widgetData {
            // Write to App Group UserDefaults
            if let appGroupDefaults = UserDefaults(suiteName: "group.com.truetrack.app") {
                appGroupDefaults.set(data, forKey: "widgetData")
                appGroupDefaults.synchronize()
                print("✅ AppDelegate: Copied to App Group UserDefaults")
            } else {
                print("❌ AppDelegate: Failed to get App Group UserDefaults")
            }
        } else {
            print("❌ AppDelegate: No widgetData found in Capacitor storage (scanned keys: \(possibleKeys))")
        }
        
        // Trigger widget refresh
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            print("🔄 AppDelegate: Widget refresh triggered")
        }
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // App is about to enter foreground
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        print("✅ AppDelegate: App became active")
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // App is about to terminate
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}