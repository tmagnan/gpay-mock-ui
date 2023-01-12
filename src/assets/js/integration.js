/**
 * @preserve
 * Google Pay Web Push Provisioning Integration Library (API version 1.6)
 *
 * @see https://developers.google.com/pay/issuers/apis/push-provisioning/web
 *
 * This code is provided to you by Google on an as-is basis, non-exclusively and
 * only for the purpose of implementing Web Push Provisioning for Google Pay.
 *
 * $Id: integration.js#6 $
 */

/**
 * This ECMAScript 6 module is a convenience library that allows payment card
 * issuers to integrate with the Google Pay Web Push Provisioning API with
 * minimal effort.
 *
 * An issuer integrator or their intermediary can incorporate it directly into
 * the JavaScript bundle of their website. It exports the following two methods
 * onto the page's Window object:
 *
 *   window.googlepay.openAppWindow(appOptions);
 *   window.googlepay.closeAppWindow();
 *
 *
 * window.googlepay.openAppWindow(appOptions);
 * =============================================
 *
 * Attempts to instantiate the Google Pay Web Push Provisioning application in a
 * new browser window.
 *
 * The appOptions parameter is an object that the integrator website uses to
 * configure the application. It includes an integrator identifier, application
 * settings, an optional session identifier, and callback functions that the
 * application calls to notify the integrator website of important events.
 *
 * Example Usage:
 *
 *   var integratorId = 'ACMEISSUER_1';  // Google's ID for the integrator.
 *
 *   var tokenSetting = 1;               // Save a token? 1 => Yes, 0 => No.
 *   var cardSetting = 1;                // Save an FPAN?
 *
 *   var isTestEnvironment = false;      // This is prod, not sandbox.
 *
 *   var clientSessionId = '0476106612151453164217831917';
 *
 *   var languageTag = 'en-US';
 *
 *   window.googlepay.openAppWindow({
 *     'integratorId': integratorId,
 *     'tokenSetting': tokenSetting,
 *     'cardSetting': cardSetting,
 *     'onReady': function(payload) {
 *       ...
 *     },
 *     'onSessionCreated': function(payload) {
 *       var publicDeviceId = payload['publicDeviceId'];
 *       var publicWalletId = payload['publicWalletId'];
 *       var serverSessionId = payload['serverSessionId'];
 *       // The integrator-specified settings may be downgraded in some cases
 *       // (e.g., if the user doesn't have an Android device that supports
 *       // contactless payments).
 *       tokenSetting = payload['tokenSetting'];
 *       cardSetting = payload['cardSetting'];
 *     },
 *     'onSuccess': function(payload) {
 *       var tokenResult = payload['tokenResult'];
 *       var cardResult = payload['cardResult'];
 *       ...
 *     },
 *     'onFailure': function(payload) {
 *       var firstErrorCode = payload['errors'][0]['errorCode'];
 *       ...
 *     },
 *     'onFinish': function(payload) {
 *       ...
 *     },
 *     'onCancel': function(payload) {
 *       ...
 *     },
 *     'isTestEnvironment': isTestEnvironment,
 *     'clientSessionId': clientSessionId,
 *     'hl': languageTag,
 *   });
 *
 * The callback functions that the integrator may specify in appOptions are
 * listed below. Only onSessionCreated is required. Each one accepts a payload
 * object parameter. Depending on the callback function, the payload may be
 * empty, or it may contain additional information about the triggering event.
 *
 *   onReady: Called the first time the application is bootstrapped, when the
 *     JavaScript is beginning to run. The application might need to refresh
 *     itself when the user's Google login is updated. In this case, onReady
 *     will not be called a second time.
 *
 *     Payload structure: {}
 *
 *   onSessionCreated: Called when the session has been created. This is a cue
 *     to the integrator to send payment credentials to Google via the secure
 *     server-to-server API. This callback function is required.
 *
 *     Payload structure: {
 *       'clientSessionId': string,
 *       'serverSessionId': string,
 *       'tokenSetting': string,
 *       'cardSetting': string,
 *       'publicDeviceId': {string|undefined},
 *       'publicWalletId': {string|undefined},
 *     }
 *
 *   onFailure: Called when the application has failed to provision either a
 *     device token or a card due to one or more fatal errors. An error message
 *     is displayed in the application window, which the user can close at their
 *     leisure.
 *
 *     Payload structure:
 *       'errors': [
 *         { 'errorCode': string },
 *         { 'errorCode': string },
 *         ...
 *       ],
 *     }
 *
 *   onFinish: Called when the application window is closed after a success or
 *     or failure message has been displayed.
 *
 *     Payload structure: {}
 *
 *   onCancel: Called when the application window is closed before a success or
 *     or failure message has been displayed.
 *
 *     Payload structure: {}
 *
 *   onSuccess: Called when the application has successfully provisioned a
 *     device token, a card, or both. A success message is displayed in the
 *     application window, which the user can close at their leisure.
 *
 *     Payload structure:
 *     {
 *       'tokenResult': string,
 *       'cardResult': string,
 *       'debugInfo': { ... },
 *     }
 *
 *
 * window.googlepay.closeAppWindow();
 * ====================================
 *
 * Immediately closes the application window, if it is open. Callback functions
 * supplied in window.googlepay.openAppWindow will no longer be called. In most
 * cases, the integrator website should not call this method. Instead, it should
 * let the user close the application window at their leisure.
 */

(() => {
  /**
   * @param {boolean} condition
   * @param {string} errorCode
   * @throws {!Error}
   */
  function assert(condition, errorCode) {
    if (!condition) {
      throw new Error(errorCode);
    }
  }

  /**
   * Asserts that the passed in value has one of the specified allowed types
   * (e.g., 'number', 'string').
   *
   * @param {?} value
   * @param {!Array<string>} allowedTypes
   * @param {string} errorCode
   * @return {?}
   * @throws {!Error}
   */
  function assertValueType(value, allowedTypes, errorCode) {
    const valueType = typeof value;
    assert(allowedTypes.includes(valueType), errorCode);
    return value;
  }

  /**
   * Returns a string representation of the passed in parameter map, formatted
   * as follows:
   *   '<key 1>=<value 1><delimiter><key 2>=<value 2>...<key N>=<value N>'.
   *
   * @param {!Map<string, string>} paramMap
   * @param {string} delimiter
   * @return {string}
   */
  function joinParams(paramMap, delimiter) {
    const params = Array.from(paramMap, ([key, value]) => `${key}=${value}`);
    return params.join(delimiter);
  }

  /**
   * @return {string} The origin of the page that is using this Integration
   *     Library (e.g., 'https://www.acmecreditunion.com').
   */
  function getCurrentPageOrigin() {
    return window.location.origin ||
        `${window.location.protocol}//${window.location.host}`;
  }

  const WINDOW_GOOGLEPAY_KEY = 'googlepay';

  const API_VERSION = 'V1_6';

  const PROD_GOOGLE_PAY_ORIGIN = 'https://pay.google.com';
  const TEST_GOOGLE_PAY_ORIGIN = 'https://pay.sandbox.google.com';

  const APP_URL_PATH = '/gp/v/a/pushprovisioning/frame';

  const FIXED_APP_WINDOW_ID_1 = 'googlepay-webpp-v1_6-app-window-1';
  const FIXED_APP_WINDOW_ID_2 = 'googlepay-webpp-v1_6-app-window-2';

  const MIN_CONTENT_HEIGHT = 700;
  const MIN_CONTENT_WIDTH = 1100;

  const POLL_APP_WINDOW_CLOSED_INTERVAL_MS = 200;

  /** @enum {string} */
  const AppOptionKey = {
    CARD_SETTING: 'cardSetting',
    CLIENT_SESSION_ID: 'clientSessionId',
    CONTENT_HEIGHT: 'contentHeight',
    CONTENT_WIDTH: 'contentWidth',
    HL: 'hl',
    INTEGRATOR_ID: 'integratorId',
    IS_TEST_ENVIRONMENT: 'isTestEnvironment',
    ON_CANCEL: 'onCancel',
    ON_FAILURE: 'onFailure',
    ON_FINISH: 'onFinish',
    ON_READY: 'onReady',
    ON_SESSION_CREATED: 'onSessionCreated',
    ON_SUCCESS: 'onSuccess',
    TOKEN_SETTING: 'tokenSetting',
  };

  /** @enum {string} */
  const UrlParamKey = {
    API_VERSION: 'apiVersion',
    CARD_SETTING: 'cardSetting',
    CSID: 'csid',
    HL: 'hl',
    INTEGRATOR_ID: 'integratorId',
    ORIGIN: 'origin',
    TOKEN_SETTING: 'tokenSetting',
    CONTENT_HEIGHT: 'contentHeight',
    CONTENT_WIDTH: 'contentWidth',
    WINDOW_FEATURES: 'windowFeatures',
  };

  /** @enum {string} */
  const WindowFeatureKey = {
    HEIGHT: 'height',
    WIDTH: 'width',
  };

  /** @enum {string} */
  const MessageDataKey = {
    ACTION: 'action',
    APP_WINDOW_ID: 'appWindowId',
    CLIENT_SESSION_ID: 'clientSessionId',
    PAYLOAD: 'payload',
  };

  /** @enum {string} */
  const Action = {
    FAILURE: 'failure',
    READY: 'ready',
    SESSION_CREATED: 'sessionCreated',
    SUCCESS: 'success',
  };

  /** @enum {string} */
  const ErrorCode = {
    INVALID_OR_MISSING_APP_OPTIONS: 'E406',
    INVALID_OR_MISSING_ON_SESSION_CREATED: 'E407',
    INVALID_OPTIONAL_CALLBACK: 'E408',
    INVALID_CONTENT_DIMENSIONS: 'E409',
    APP_WINDOW_ALREADY_OPEN: 'E410',
    APP_WINDOW_NOT_OPENED: 'E411',
  };

  /**
   * A payload object passed in to an integrator-specified callback.
   * @typedef {!Object<string, *>}
   */
  let Payload;

  /**
   * An integrator-specified callback function that takes in a payload object.
   * @typedef {function(!Payload): undefined}
   */
  let Callback;

  /**
   * An internal representation of the appOptions object that integrators are
   * instructed to pass in to window.googlepay.openAppWindow.
   *
   * Why don't we declare this as a {@literal @}record and {@literal @}export
   * the keys? Integrators are instructed to declare appOptions keys as strings,
   * whereas exported record keys are declared as symbols. If an integrator were
   * to apply their own obfuscation to our already minified code, then the
   * exported record keys would be renamed, making it impossible to correlate
   * them with the string keys in the integrator-specified appOptions.
   *
   * @final
   */
  class AppOptions {
    /**
     * Constructor that takes in integrator-specified app options and performs
     * type checks and other validations on some of its fields.
     *
     * Only the callback functions and window features are validated here.
     * Everything else is passed to the server as-is and validated there.
     *
     * @param {!Object<string, *>} appOptionsObject
     * @throws {!Error}
     */
    constructor(appOptionsObject) {
      /**
       * @param {?} value
       * @return {?}
       * @throws {!Error}
       */
      const assertOptionalCallback = (value) => {
        return assertValueType(
            value, ['function', 'undefined'],
            ErrorCode.INVALID_OPTIONAL_CALLBACK);
      };

      // Extract and validate the callback functions. Only onSessionCreated is
      // required.
      /** @const {!Callback} */
      this.onSessionCreated = assertValueType(
          appOptionsObject[AppOptionKey.ON_SESSION_CREATED], ['function'],
          ErrorCode.INVALID_OR_MISSING_ON_SESSION_CREATED);
      /** @const {!Callback|undefined} */
      this.onReady =
          assertOptionalCallback(appOptionsObject[AppOptionKey.ON_READY]);
      /** @const {!Callback|undefined} */
      this.onSuccess =
          assertOptionalCallback(appOptionsObject[AppOptionKey.ON_SUCCESS]);
      /** @const {!Callback|undefined} */
      this.onFailure =
          assertOptionalCallback(appOptionsObject[AppOptionKey.ON_FAILURE]);
      /** @const {!Callback|undefined} */
      this.onFinish =
          assertOptionalCallback(appOptionsObject[AppOptionKey.ON_FINISH]);
      /** @const {!Callback|undefined} */
      this.onCancel =
          assertOptionalCallback(appOptionsObject[AppOptionKey.ON_CANCEL]);

      // Extract and validate the content height and width, if specified. Either
      // both must be numbers, or both must be undefined. Minimum dimensions are
      // not enforced here.
      /** @const {number|undefined} */
      this.contentHeight = assertValueType(
          appOptionsObject[AppOptionKey.CONTENT_HEIGHT],
          ['number', 'undefined'], ErrorCode.INVALID_CONTENT_DIMENSIONS);
      /** @const {number|undefined} */
      this.contentWidth = assertValueType(
          appOptionsObject[AppOptionKey.CONTENT_WIDTH],
          [typeof this.contentHeight], ErrorCode.INVALID_CONTENT_DIMENSIONS);

      // Extract everything else as-is. Defer further validation to the server.
      this.integratorId = appOptionsObject[AppOptionKey.INTEGRATOR_ID];
      /** @const {*} */
      this.tokenSetting = appOptionsObject[AppOptionKey.TOKEN_SETTING];
      /** @const {*} */
      this.cardSetting = appOptionsObject[AppOptionKey.CARD_SETTING];
      /** @const {*} */
      this.isTestEnvironment =
          appOptionsObject[AppOptionKey.IS_TEST_ENVIRONMENT];
      /** @const {*} */
      this.clientSessionId = appOptionsObject[AppOptionKey.CLIENT_SESSION_ID];
      /** @const {*} */
      this.hl = appOptionsObject[AppOptionKey.HL];
    }
  }

  /**
   * Internal class for instantiating and interacting with an instance of the
   * Google Pay Web Push Provisioning application in a separate window.
   *
   * @final
   */
  class AppContext {
    /**
     * Constructor that takes in an {@link AppOptions} object containing
     * *partially* validated integrator-specified app options, configures the
     * application (callback functions, window id, URL, etc.), and opens it in a
     * new window.
     *
     * @param {!AppOptions} appOptions
     * @throws {!Error}
     */
    constructor(appOptions) {
      /** @private @const {!Map<!Action, !Callback|undefined>} */
      this.actionMap_ = AppContext.makeActionMap_(appOptions);
      /** @private @const {!Callback|undefined} */
      this.onFinish_ = appOptions.onFinish;
      /** @private @const {!Callback|undefined} */
      this.onCancel_ = appOptions.onCancel;

      /** @private @const {string} */
      this.appWindowId_ = (window.name === FIXED_APP_WINDOW_ID_1) ?
          FIXED_APP_WINDOW_ID_2 :
          FIXED_APP_WINDOW_ID_1;

      /** @private @const {string} */
      this.appOrigin_ = appOptions.isTestEnvironment ? TEST_GOOGLE_PAY_ORIGIN :
                                                       PROD_GOOGLE_PAY_ORIGIN;

      const appWindowFeatures = AppContext.getAppWindowFeatures_(appOptions);
      const appQueryString =
          AppContext.getAppQueryString_(appOptions, appWindowFeatures);
      const appUrl = `${this.appOrigin_}${APP_URL_PATH}${appQueryString}`;

      // This call to window.open is allowed per cl/293875122.
      /** @private @const {?Window} */
      this.appWindow_ =
          window.open(appUrl, this.appWindowId_, appWindowFeatures);
      assert(Boolean(this.appWindow_), ErrorCode.APP_WINDOW_NOT_OPENED);

      /** @private {boolean} */
      this.receivedAppOutcome_ = false;

      // Start polling the status of the application window immediately after
      // opening it.
      this.pollAppWindowClosed_();
    }

    /** @return {boolean} True if the application window is currently open. */
    isAppWindowOpen() {
      return Boolean(this.appWindow_) && !this.appWindow_.closed;
    }

    /** Closes the application window if it is currently open. */
    closeAppWindow() {
      if (this.isAppWindowOpen()) {
        this.appWindow_.close();
      }
    }

    /**
     * Handles a 'message' event which may or may not be from the Google Pay Web
     * Push Provisioning application window.
     *
     * If the passed in {@link MessageEvent} was sent by the currently open
     * application window and contains a supported {@link Action}, then the
     * integrator-specified callback function that corresponds to that Action is
     * invoked, and the payload in the message data is passed in as a parameter.
     *
     * @param {!MessageEvent} messageEvent
     */
    handleMessageEvent(messageEvent) {
      const messageData = messageEvent.data || {};

      if (!this.isAppWindowOpen() || messageEvent.origin !== this.appOrigin_ ||
          messageData[MessageDataKey.APP_WINDOW_ID] !== this.appWindowId_ ||
          !messageData[MessageDataKey.ACTION]) {
        return;
      }

      /** @type {!Action} */
      const action = messageData[MessageDataKey.ACTION];

      if (action === Action.SUCCESS || action === Action.FAILURE) {
        this.receivedAppOutcome_ = true;
      }

      const callback = this.actionMap_.get(action);
      if (callback) {
        callback(messageData[MessageDataKey.PAYLOAD]);
      }
    }

    /**
     * Extracts validated, integrator-specified callback functions that
     * correspond to application {@link Action}s from an {@link AppOptions}
     * object; returns them in the form of a map.
     *
     * Note that onFinish and onCancel are not stored in the map because they do
     * not correspond to Actions. Also, since most of the callback functions are
     * optional, some of the values in the map may be undefined.
     *
     * @param {!AppOptions} appOptions
     * @return {!Map<!Action, !Callback|undefined>}
     * @private
     */
    static makeActionMap_(appOptions) {
      return new Map()
          .set(Action.SESSION_CREATED, appOptions.onSessionCreated)
          .set(Action.READY, appOptions.onReady)
          .set(Action.SUCCESS, appOptions.onSuccess)
          .set(Action.FAILURE, appOptions.onFailure);
    }

    /**
     * Generates a window features string to be passed in to window.open when
     * instantiating the application window.
     *
     * @param {!AppOptions} appOptions
     * @return {string}
     * @throws {!Error}
     * @private
     */
    static getAppWindowFeatures_(appOptions) {
      if (!appOptions.contentHeight || !appOptions.contentWidth) {
        return '';
      }

      // Make the window sufficiently large to avoid clipping the application
      // content. Override the integrator-specified dimensions if necessary.
      const /** !Map<string, string> */ appWindowFeatureMap = new Map([
        [
          WindowFeatureKey.HEIGHT,
          Math.max(MIN_CONTENT_HEIGHT, appOptions.contentHeight).toString(),
        ],
        [
          WindowFeatureKey.WIDTH,
          Math.max(MIN_CONTENT_WIDTH, appOptions.contentWidth).toString(),
        ],
      ]);
      return joinParams(appWindowFeatureMap, ',');
    }

    /**
     * Generates a query string with the full set of URL parameters to send when
     * fetching the Google Pay Web Push Provisioning application content from
     * the server.
     *
     * The window features (e.g., height and width) are sent as one of the URL
     * parameters, in addition to being passed in as the separate windowFeatures
     * string parameter to window.open. As a URL parameter, they don't have any
     * direct effect on the application, but the server may take them into
     * account when generating the application content.
     *
     * @param {!AppOptions} appOptions
     * @param {string} appWindowFeatures
     * @return {string}
     * @private
     */
    static getAppQueryString_(appOptions, appWindowFeatures) {
      /**
       * @param {!UrlParamKey} urlParamKey
       * @param {?} value
       */
      const processUrlParam = (urlParamKey, value) => {
        if (typeof value !== 'undefined' && value !== '' && value !== null) {
          urlParamMap.set(urlParamKey, encodeURIComponent(value.toString()));
        }
      };

      const /** !Map<string, string> */ urlParamMap = new Map([
        [UrlParamKey.API_VERSION, API_VERSION],
        [UrlParamKey.ORIGIN, encodeURIComponent(getCurrentPageOrigin())],
      ]);
      processUrlParam(UrlParamKey.INTEGRATOR_ID, appOptions.integratorId);
      processUrlParam(UrlParamKey.TOKEN_SETTING, appOptions.tokenSetting);
      processUrlParam(UrlParamKey.CARD_SETTING, appOptions.cardSetting);
      processUrlParam(UrlParamKey.CSID, appOptions.clientSessionId);
      processUrlParam(UrlParamKey.HL, appOptions.hl);
      processUrlParam(UrlParamKey.WINDOW_FEATURES, appWindowFeatures);

      return `?${joinParams(urlParamMap, '&')}`;
    }

    /**
     * Calls an integrator-specified onFinish or onCancel callback if it detects
     * that the application window has been closed -- onFinish if a 'success' or
     * 'failure' {@link Action} has been received, or onCancel otherwise.
     * Schedules itself to be called again if continued polling is needed.
     *
     * This method is a no-op if the integrator didn't specify either an
     * onFinish or an onCancel callback.
     *
     * Polling is the only reliable way to detect when the application window is
     * closed. In a desktop browser this could be accomplished by instrumenting
     * the application window's 'pagehide', 'beforeunload', or 'unload' event;
     * however, these events are not fired on window closure in mobile browsers.
     *
     * @private
     */
    pollAppWindowClosed_() {
      if (this.appWindow_.closed) {
        if (this.onFinish_ && this.receivedAppOutcome_) {
          this.onFinish_({});
        } else if (this.onCancel_ && !this.receivedAppOutcome_) {
          this.onCancel_({});
        }
      } else if (
          this.onFinish_ || (this.onCancel_ && !this.receivedAppOutcome_)) {
        setTimeout(
            () => this.pollAppWindowClosed_(),
            POLL_APP_WINDOW_CLOSED_INTERVAL_MS);
      }
    }
  }

  /**
   * Singleton instance of {@link AppContext}. This variable will be assigned a
   * new AppContext every time a new application window is opened, but it should
   * always be the only instance in existence.
   *
   * @type {?AppContext}
   */
  let currentAppContext = null;

  /**
   * @param {!Object<string, *>} appOptionsObject
   * @throws {!Error}
   */
  function openAppWindow(appOptionsObject) {
    assertValueType(
        appOptionsObject, ['object'], ErrorCode.INVALID_OR_MISSING_APP_OPTIONS);
    assert(appOptionsObject !== null, ErrorCode.INVALID_OR_MISSING_APP_OPTIONS);
    const appOptions = new AppOptions(appOptionsObject);

    assert(
        !currentAppContext || !currentAppContext.isAppWindowOpen(),
        ErrorCode.APP_WINDOW_ALREADY_OPEN);
    currentAppContext = new AppContext(appOptions);
  }

  function closeAppWindow() {
    if (currentAppContext) {
      currentAppContext.closeAppWindow();
    }
  }

  /**
   * Handles a 'message' event which may or may not be from a Google Pay Web
   * Push Provisioning application window by forwarding it to the corresponding
   * handler method on the current singleton instance of {@link AppContext}.
   *
   * If the singleton AppContext is null, then the event is ignored, as it is
   * either unexpected or not related to Google Pay Web Push Provisioning.
   *
   * @param {!Event} event
   */
  function handleMessageEvent(event) {
    if (currentAppContext) {
      currentAppContext.handleMessageEvent(
          /** @type {!MessageEvent} */ (event));
    }
  }

  function handleUnloadEvent() {
    window.removeEventListener('message', handleMessageEvent);
    window.removeEventListener('unload', handleUnloadEvent);

    closeAppWindow();
  }

  window.addEventListener('message', handleMessageEvent);
  window.addEventListener('unload', handleUnloadEvent);

  window[WINDOW_GOOGLEPAY_KEY] = window[WINDOW_GOOGLEPAY_KEY] || {
    'openAppWindow': openAppWindow,
    'closeAppWindow': closeAppWindow,
  };
})();
