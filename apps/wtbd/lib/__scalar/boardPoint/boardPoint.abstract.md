# boardPoint Abstract

A point in a camera frame, embedded by scans to mark where the board's L marks were found.

## Rules

- Values are fractions of the camera frame (0 to 1), not board fractions and not pixels, so an overlay scales to
  any preview size without knowing the frame's resolution.
