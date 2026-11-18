# Content Fragment Block

Authoring-only support-case reproduction for E-002577389. This block exposes an
existing Content Fragment's native model in the Universal Editor properties
panel. It does not render fragment field values on the public site.

## Configuration and integration

- Add **Content Fragment Block** to a normal page section in Universal Editor.
- Select a disposable fragment with the **Content Fragment** picker. The
  `reference` property stores its `/content/dam/...` path.
- Select the inner **Content Fragment fields** card, either in the canvas or
  the content tree. The outer block retains the picker for changing references.
- The `aem-fragments` connection in `head.html` points at
  `https://author-p167205-e1910614.adobeaemcloud.com`. Update it if this site
  moves to another Author environment. Authors need an authenticated AEM session
  and permission to edit the fragment.
- The inner resource targets the fragment's `jcr:content/data/master` variation.
  Universal Editor obtains the fragment model and performs persistence; this
  block defines no duplicate field model and sends no API write requests.

## Reproducing the support case

Use a test fragment whose model contains a multi-value enumeration rendered as
checkboxes, for example options `1` through `7`. In the inner card's properties,
select multiple values in one row or click **Add**. Inspect the browser Network
panel for the native Content Fragment API request and its response.

Universal Editor saves automatically. The reported issue can corrupt values, so
do not use production fragments. This block enables testing; it does not fix or
work around the reported checkbox serialization defect.

## Behavior and errors

The card is hidden on pages without the block's authoring instrumentation.
Published pages do not fetch or expose fragment field values. There are no URL
parameters, local-storage settings, or custom editor event handlers. Existing
editor-support handling refreshes the page after native fragment updates when
an inline page patch cannot be applied.

An empty reference displays selection instructions. An invalid reference,
foreign Author URL, or missing connection displays an alert and logs an error
instead of exposing an editable resource. Fragment/model loading and permission
errors are reported by Universal Editor itself.
