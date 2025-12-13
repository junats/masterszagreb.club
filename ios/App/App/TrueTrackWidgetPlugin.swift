import Foundation
import Capacitor
// import WidgetKit

@objc(TrueTrackWidgetPlugin)
public class TrueTrackWidgetPlugin: CAPPlugin {

    override public func load() {
        super.load()
        print("TrueTrackWidgetPlugin: Loaded successfully!")
        // fatalError("CRASH TEST: load() called!") // Uncomment to test startup load
    }

    @objc public func echo123(_ call: CAPPluginCall) {
        fatalError("CRASH TEST: echo123() reached! The connection WORKS!")
        // print("TrueTrackWidgetPlugin: testEcho called")
        // let value = call.getString("value") ?? ""
        // call.resolve(["value": value])
    }

    @objc public func ping(_ call: CAPPluginCall) {
        print("TrueTrackWidgetPlugin: ping called")
        call.resolve(["value": "pong"])
    }

    @objc func setWidgetData(_ call: CAPPluginCall) {
        guard let value = call.getString("value") else {
            call.reject("No value provided")
            return
        }

        let success = WidgetHelper.shared.setWidgetData(value)

        if success {
            let path = "group.com.truetrack.app/widget_data"
            call.resolve(["success": true, "filePath": path])
        } else {
            call.reject("Failed to write to App Group")
        }
    }
    */
}

/*
@objc public class WidgetHelper: NSObject {
    @objc public static let shared = WidgetHelper()
    
    @objc public func echo(_ value: String) -> String {
        return value
    }
    
    @objc public func setWidgetData(_ jsonString: String) -> Bool {
        print("WidgetHelper: setWidgetData called with: \(jsonString)")
        
        guard let userDefaults = UserDefaults(suiteName: "group.com.truetrack.app") else {
            print("WidgetHelper: Could not access App Group")
            return false
        }
        
        userDefaults.set(jsonString, forKey: "widget_data")
        userDefaults.synchronize()
        
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            print("WidgetHelper: WidgetCenter reloadAllTimelines called")
        }
        
        return true
    }
}
*/
