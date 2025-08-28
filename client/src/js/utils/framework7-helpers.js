/**
 * Framework7 Helper Utilities
 * Demonstrates full Framework7 capabilities now available
 */

// Toast notifications
export const showToast = (message, options = {}) => {
  return window.app.toast.create({
    text: message,
    position: 'bottom',
    closeTimeout: 3000,
    ...options
  }).open()
}

// Success toast
export const showSuccess = (message) => {
  return showToast(message, {
    icon: '<i class="f7-icons">checkmark_circle_fill</i>',
    cssClass: 'toast-success'
  })
}

// Error toast
export const showError = (message) => {
  return showToast(message, {
    icon: '<i class="f7-icons">xmark_circle_fill</i>',
    cssClass: 'toast-error'
  })
}

// Loading dialog
export const showLoading = (title = 'Loading...') => {
  return window.app.dialog.preloader(title)
}

// Hide loading
export const hideLoading = () => {
  window.app.dialog.close()
}

// Confirmation dialog
export const showConfirm = (title, message, callback) => {
  return window.app.dialog.confirm(message, title, callback)
}

// Alert dialog
export const showAlert = (title, message, callback) => {
  return window.app.dialog.alert(message, title, callback)
}

// Prompt dialog
export const showPrompt = (title, message, callback, defaultValue = '') => {
  return window.app.dialog.prompt(message, title, callback, callback, defaultValue)
}

// Action sheet
export const showActionSheet = (buttons, title) => {
  return window.app.actions.create({
    buttons: buttons,
    title: title
  }).open()
}

// Popup
export const showPopup = (content, options = {}) => {
  return window.app.popup.create({
    content: content,
    animate: true,
    backdrop: true,
    closeByBackdropClick: true,
    ...options
  }).open()
}

// Sheet modal
export const showSheet = (content, options = {}) => {
  return window.app.sheet.create({
    content: content,
    animate: true,
    backdrop: true,
    closeByBackdropClick: true,
    swipeToClose: true,
    ...options
  }).open()
}

// Notification
export const showNotification = (options = {}) => {
  return window.app.notification.create({
    title: 'Pandora Box',
    closeTimeout: 5000,
    closeButton: true,
    swipeToClose: true,
    ...options
  }).open()
}

// Photo browser
export const openPhotoBrowser = (photos, options = {}) => {
  return window.app.photoBrowser.create({
    photos: photos,
    theme: 'dark',
    type: 'popup',
    toolbar: true,
    navbar: true,
    ...options
  }).open()
}

// Swiper utilities
export const createSwiper = (container, options = {}) => {
  return window.app.swiper.create(container, {
    speed: 300,
    spaceBetween: 10,
    slidesPerView: 1,
    ...options
  })
}

// Device detection utilities
export const device = {
  get isIos() { return window.Framework7?.device?.ios || false },
  get isAndroid() { return window.Framework7?.device?.android || false },
  get isDesktop() { return window.Framework7?.device?.desktop || false },
  get isMobile() { return window.Framework7?.device?.mobile || false },
  get isTablet() { return window.Framework7?.device?.tablet || false },
  get isPhone() { return window.Framework7?.device?.phone || false },
  get isCordova() { return window.Framework7?.device?.cordova || false },
  get isCapacitor() { return window.Framework7?.device?.capacitor || false },
  get needsStatusbarOverlay() { return window.Framework7?.device?.needsStatusbarOverlay || false },
  get support() { return window.Framework7?.support || {} }
}

// Request utilities
export const request = {
  get: (url, data, success, error, dataType) => {
    return window.Framework7?.request?.get?.(url, data, success, error, dataType)
  },
  post: (url, data, success, error, dataType) => {
    return window.Framework7?.request?.post?.(url, data, success, error, dataType)
  },
  json: (url, data, success, error) => {
    return window.Framework7?.request?.json?.(url, data, success, error)
  },
  promise: (options) => {
    return window.Framework7?.request?.promise?.(options)
  }
}

// Utils
export const utils = {
  get parseUrlQuery() { return window.Framework7?.utils?.parseUrlQuery },
  get serializeObject() { return window.Framework7?.utils?.serializeObject },
  get requestAnimationFrame() { return window.Framework7?.utils?.requestAnimationFrame },
  get cancelAnimationFrame() { return window.Framework7?.utils?.cancelAnimationFrame },
  get nextTick() { return window.Framework7?.utils?.nextTick },
  get nextFrame() { return window.Framework7?.utils?.nextFrame },
  get id() { return window.Framework7?.utils?.id },
  get mdPreloaderContent() { return window.Framework7?.utils?.mdPreloaderContent },
  get iosPreloaderContent() { return window.Framework7?.utils?.iosPreloaderContent },
  get auroraPreloaderContent() { return window.Framework7?.utils?.auroraPreloaderContent },
  get eventNameToColonCase() { return window.Framework7?.utils?.eventNameToColonCase },
  get deleteProps() { return window.Framework7?.utils?.deleteProps },
  get extend() { return window.Framework7?.utils?.extend },
  get colorHexToRgb() { return window.Framework7?.utils?.colorHexToRgb },
  get colorRgbToHex() { return window.Framework7?.utils?.colorRgbToHex },
  get colorRgbToHsl() { return window.Framework7?.utils?.colorRgbToHsl },
  get colorHslToRgb() { return window.Framework7?.utils?.colorHslToRgb },
  get colorThemeCSSProperties() { return window.Framework7?.utils?.colorThemeCSSProperties }
}

// DOM utilities (Dom7/$$)
export const $$ = window.$$

// Export all for easy access
export default {
  showToast,
  showSuccess,
  showError,
  showLoading,
  hideLoading,
  showConfirm,
  showAlert,
  showPrompt,
  showActionSheet,
  showPopup,
  showSheet,
  showNotification,
  openPhotoBrowser,
  createSwiper,
  device,
  request,
  utils,
  $$
}