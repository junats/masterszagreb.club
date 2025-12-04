import Foundation
import Capacitor
import WidgetKit

@objc(TrueTrackWidgetImplementation)
public class TrueTrackWidgetImplementation: CAPPlugin {
    
    override public func load() {
        print("TrueTrackWidget: [SWIFT] load() called")
    }
    
    public override init() {
        super.init()
        print("TrueTrackWidget: [SWIFT] init() called - Instance: \(Unmanaged.passUnretained(self).toOpaque())")
        
        let selector = Selector("testEcho:")
        if self.responds(to: selector) {
            print("TrueTrackWidget: [SWIFT] Responds to testEcho: YES")
        } else {
            print("TrueTrackWidget: [SWIFT] Responds to testEcho: NO")
        }
    }
    
    @objc public dynamic func testEcho(_ call: CAPPluginCall) {
        print("TrueTrackDataPlugin: testEcho called!")
        let value = call.getString("value") ?? ""
        call.resolve(["value": value])
    }

    @objc public dynamic func ping(_ call: CAPPluginCall) {
        print("TrueTrackDataPlugin: ping called!")
        call.resolve(["value": "pong"])
    }
    
    @objc public dynamic func setWidgetData(_ call: CAPPluginCall) {
        print("TrueTrackDataPlugin: setWidgetData called!")
        
        guard let key = call.getString("key"),
              let value = call.getString("value") else {
            print("TrueTrackDataPlugin: Missing key or value")
            call.reject("Must provide key and value")
            return
        }
        
        // STRICT CHECK: Use FileManager to verify the container exists
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.truetrack.app") else {
            print("TrueTrackDataPlugin: FileManager returned NIL for group.com.truetrack.app - ENTITLEMENTS ERROR")
            call.resolve(["success": false, "error": "FileManager could not find App Group container"])
            return
        }
        
        print("TrueTrackDataPlugin: FileManager confirmed valid container at: \(containerURL.path)")
        
        // Write to file instead of UserDefaults
        let fileURL = containerURL.appendingPathComponent("widget_data.json")
        
        do {
            try value.write(to: fileURL, atomically: true, encoding: .utf8)
            print("TrueTrackDataPlugin: Successfully wrote data to file: \(fileURL.path)")
            
            // Reload Widget Timeline
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
                print("TrueTrackDataPlugin: Requested Widget Timeline Reload")
            }
            
            call.resolve([
                "success": true,
                "filePath": fileURL.path
            ])
        } catch {
            print("TrueTrackDataPlugin: Failed to write to file: \(error)")
            call.resolve(["success": false, "error": "Failed to write file: \(error.localizedDescription)"])
        }
    }
}
