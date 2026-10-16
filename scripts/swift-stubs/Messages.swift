@_exported import Foundation
import UIKit
open class MSConversation { public func insertAttachment(_ u: URL, withAlternateFilename: String?, completionHandler: ((Error?) -> Void)? = nil) {} }
open class MSMessagesAppViewController: UIViewController { public var activeConversation: MSConversation?; open func willBecomeActive(with c: MSConversation) {} }
open class MSSticker { public init(contentsOfFileURL: URL, localizedDescription: String) throws {} }
open class MSStickerView: UIView { public init(frame: CGRect, sticker: MSSticker?) { super.init(frame: frame) }; public func startAnimating() {} }
