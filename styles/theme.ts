import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  fonts: {
    heading: "'Comic Neue', cursive",
    body: "'Comic Neue', cursive",
  },
  colors: {
    catPurple: {
      50: "#f3e5f5",
      100: "#e1bee7",
      200: "#ce93d8",
      300: "#ba68c8",
      400: "#ab47bc",
      500: "#9c27b0",
      600: "#8e24aa",
      700: "#7b1fa2",
      800: "#6a1b9a",
      900: "#4a148c",
    },
    catYellow: {
      50: "#fffde7",
      100: "#fff9c4",
      200: "#fff59d",
      300: "#fff176",
      400: "#ffee58",
      500: "#ffeb3b",
      600: "#fdd835",
      700: "#fbc02d",
      800: "#f9a825",
      900: "#f57f17",
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "bold",
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: "bold",
        
      },
    },
  },
});

export default theme;