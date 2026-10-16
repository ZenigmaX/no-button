@_exported import Foundation
public struct Selector { public init(_ s: String) {} }
public struct CGAffineTransform { public init(scaleX: CGFloat, y: CGFloat) {}; public static let identity = CGAffineTransform(scaleX: 1, y: 1) }
public class CGColor {}
open class NSLayoutConstraint { public static func activate(_ c: [NSLayoutConstraint]) {}; public var isActive = false }
open class NSLayoutAnchor { public func constraint(equalTo a: NSLayoutAnchor, constant: CGFloat = 0) -> NSLayoutConstraint { NSLayoutConstraint() } }
open class NSLayoutDimension { public func constraint(equalToConstant c: CGFloat) -> NSLayoutConstraint { NSLayoutConstraint() } }
open class UILayoutGuide { public var topAnchor = NSLayoutAnchor(); public var bottomAnchor = NSLayoutAnchor(); public var leadingAnchor = NSLayoutAnchor(); public var trailingAnchor = NSLayoutAnchor() }
open class UIColor { public init(red: CGFloat, green: CGFloat, blue: CGFloat, alpha: CGFloat) {}; public init(white: CGFloat, alpha: CGFloat) {}; public static let white = UIColor(white: 1, alpha: 1); public var cgColor = CGColor() }
open class UIFont { public static func systemFont(ofSize s: CGFloat, weight: Weight) -> UIFont { UIFont() }; public struct Weight { public static let heavy = Weight() } }
open class CALayer { public var cornerRadius: CGFloat = 0; public var borderWidth: CGFloat = 0; public var borderColor: CGColor? }
open class UIView { public init() {}; public init(frame: CGRect) {}
  public var backgroundColor: UIColor?; public var translatesAutoresizingMaskIntoConstraints = true; public var isHidden = false
  public var subviews: [UIView] = []; public var layer = CALayer(); public var transform = CGAffineTransform.identity; public var tag = 0
  public var topAnchor = NSLayoutAnchor(); public var bottomAnchor = NSLayoutAnchor(); public var leadingAnchor = NSLayoutAnchor(); public var trailingAnchor = NSLayoutAnchor(); public var heightAnchor = NSLayoutDimension()
  public var safeAreaLayoutGuide = UILayoutGuide()
  public func addSubview(_ v: UIView) {}
  public class func animate(withDuration d: Double, animations: @escaping () -> Void, completion: ((Bool) -> Void)? = nil) {}
  public class func animate(withDuration d: Double, delay: Double, usingSpringWithDamping: CGFloat, initialSpringVelocity: CGFloat, options: [Int], animations: @escaping () -> Void) {} }
public struct UIControlState: OptionSet { public let rawValue: Int; public init(rawValue: Int) { self.rawValue = rawValue }; public static let normal = UIControlState(rawValue: 0) }
public struct UIControlEvent: OptionSet { public let rawValue: Int; public init(rawValue: Int) { self.rawValue = rawValue }; public static let valueChanged = UIControlEvent(rawValue: 1); public static let touchUpInside = UIControlEvent(rawValue: 2) }
open class UIControl: UIView { public typealias State = UIControlState; public typealias Event = UIControlEvent; public func addTarget(_ t: Any?, action: Selector, for e: UIControlEvent) {} }
open class UILabel: UIView { public var numberOfLines = 1; public var textAlignment = NSTextAlignment.left; public var font: UIFont? }
public enum NSTextAlignment { case left, center }
open class UIButton: UIControl { public enum ButtonType { case system }; public init(type: ButtonType) { super.init() }
  public var titleLabel: UILabel? ; public func setTitle(_ t: String?, for s: UIControlState) {}; public func setTitleColor(_ c: UIColor?, for s: UIControlState) {} }
open class UISegmentedControl: UIControl { public init(items: [Any]) { super.init() }; public var selectedSegmentIndex = 0; public var selectedSegmentTintColor: UIColor?
  public func setTitleTextAttributes(_ a: [NSAttributedString.Key: Any]?, for s: UIControlState) {} }
open class UIScrollView: UIView { public var alwaysBounceVertical = false; public var contentLayoutGuide = UILayoutGuide(); public var frameLayoutGuide = UILayoutGuide() }
open class UIStackView: UIView { public enum Axis { case vertical, horizontal }; public enum Distribution { case fillEqually }
  public var axis = Axis.vertical; public var spacing: CGFloat = 0; public var distribution = Distribution.fillEqually; public var arrangedSubviews: [UIView] = []; public func addArrangedSubview(_ v: UIView) {} }
open class UIViewController { public init() {}; public var view = UIView(); open func viewDidLoad() {} }
open class UIImpactFeedbackGenerator { public enum FeedbackStyle { case heavy }; public init(style: FeedbackStyle) {}; public func impactOccurred() {} }
public extension NSAttributedString.Key { static let foregroundColor = NSAttributedString.Key("NSColor") }
