type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  imageSrc: string;
  imageAlt: string;
  details: string;
  summary: string;
  availableSizes: string[];
  availableColors: string[];
  requiresXahau?: boolean; // Optional property
};

export const products: Product[] = [
  {
    id: "1",
    slug: "sweater",
    title: "xSweater",
    price: 0.01,
    imageSrc: "/product-images/hoodie-1.png",
    imageAlt: "Cozy sweater",
    details: "Stay warm with this premium hoodie.",
    summary: "Stay warm & stylish during winter!",
    availableSizes: ["S", "M", "L", "XL"],
    availableColors: ["Black"],
    requiresXahau: true, // This product requires Xahau network
  },
  {
    id: "2",
    slug: "xMug",
    title: "XAH Mug",
    price: 0.01,
    imageSrc: "/product-images/mug-1.png",
    imageAlt: "Ceramic mug",
    details: "Sip in style with our limited edition mug.",
    summary: "Sip in style with our limited edition mug.",
    availableSizes: ["One Size"],
    availableColors: ["Black"],
    requiresXahau: true, // This product requires Xahau network
  },
  {
    id: "3",
    slug: "hat",
    title: "xTrucker",
    price: 0.01,
    imageSrc: "/product-images/hat-1.png",
    imageAlt: "Stylish xhat",
    details: "Top off your look with this cool cap.",
    summary: "Top off your look with this cool cap.",
    availableSizes: ["Snap Back"],
    availableColors: ["Gray & Black"],
    requiresXahau: true, // This product requires Xahau network
  },
  {
    id: "4",
    slug: "xTee",
    title: "xTee",
    price: 0.01,
    imageSrc: "/product-images/cup-black.png",
    imageAlt: "Xahau Tee",
    details: "Supporting Devs building on Xahau Squad.",
    summary: "Devs building on Xah network.",
    availableSizes: ["One Size"],
    availableColors: ["Default"],
    requiresXahau: true, // This product requires Xahau network
  },
  {
    id: "5",
    slug: "xBox",
    title: "xBlind Box",
    price: 0.01,
    imageSrc: "/product-images/bbox.png",
    imageAlt: "Xahau Tee",
    details: "Select your preffered size & color and each month we'll send you a BlindBox full of surprises.",
    summary: "Xahau Blind Box hidden gems.",
    availableSizes: ["S", "M", "L", "XL"],
    availableColors: ["Black", "White", "Grey", "Yellow"],
    requiresXahau: true, // This product requires Xahau network
  },
];
