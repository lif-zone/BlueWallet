// The side with the wallets list, on the web: by the width of the window,
// not by the device (which is always 'Desktop' here). A phone in portrait
// has no room for it; in landscape, and on a desktop, it has.
const wide_min_width = 640;

export const wide_layout = width=>width>=wide_min_width;
