
const path = require("path");

units = {
    gpus: {
        H100_SXM: {
            type: "H100", 
            producer: "NVIDIA", 
            gpu_memory: 80, 
        },
        H100_PCIE: {
            type: "H100", 
            producer: "NVIDIA", 
            gpu_memory: 80, 
        },
        H100_NVL: {
            type: "H100", 
            producer: "NVIDIA", 
            gpu_memory: 188, 
        },
        A100_PCIE : {
            type: "A100", 
            producer: "NVIDIA", 
            gpu_memory: 80, 
        },
        A100_SXM: {
            type: "A100", 
            producer: "NVIDIA", 
            gpu_memory: 80, 
        },
        A800_40G_PCIE: {
            type: "A800", 
            producer: "NVIDIA", 
            gpu_memory: 40, 
        },
        A800_80G_PCIE: {
            type: "A800", 
            producer: "NVIDIA", 
            gpu_memory: 80, 
        },
        A800_80G_SXM: {
            type: "A800", 
            producer: "NVIDIA", 
            gpu_memory: 80, 
        },
        H800: {
            type: "H800", 
            producer: "NVIDIA", 
            gpu_memory: 80,
        },
        GTX_1050: {
            type: "GTX1050", 
            producer: "NVIDIA", 
            gpu_memory:3, 
        },
        GTX_1060: {
            type: "GTX1060", 
            producer: "NVIDIA", 
            gpu_memory:"3GB HBM2", 
        },
        CPU: {
            type: "CPU" 
        }
    },
    default_parameters: {
        H100_NVL: "max",
        H100_SXM: "max",
        H100_PCIE: "max",
        A100_SXM: "max",
        A100_PCIE: "max",
        A800_80G_SXM: "max",
        A800_40G_PCIE: "max",
        A800_80G_PCIE: "max",
        H800: "mid",
        GTX_1060: "min",
        GTX_1050: "test02",
        CPU: "test03",
    },
    parameters: {
        min: {
            parameter: {
                leaf_count: 838860800,
                leaf_deep : 100,
                sample    : 10,
            },
            computility: {
                GTX_1060: {
                    min: 500,
                    max: 800,
                }
            }
        },
        mid: {
            parameter: {
                leaf_count: 8388608000,
                leaf_deep : 2000,
                sample    : 10,
            },
            computility: {
                H800: {
                    min: 500,
                    max: 800,
                }
            }
        },
        max: {
            parameter: {
                leaf_count: 838860800000,
                leaf_deep : 30000000000,
                sample    : 10,
            },
            computility: {
                A800_80G_SXM: {
                    min: 500,
                    max: 800,
                },
                A800_40G_PCIE: {
                    min: 600,
                    max: 1600,
                },
                A800_80G_PCIE: {
                    min: 500,
                    max: 800,
                },
                A100_SXM: {
                    min: 400,
                    max: 700,
                },
                A100_PCIE: {
                    min: 500,
                    max: 700,
                },
                H100_NVL: {
                    min: 500,
                    max: 900,
                },
                H100_SXM: {
                    min: 500,
                    max: 900,
                },
                H100_PCIE: {
                    min: 500,
                    max: 900,
                },
            }
        },
        test01: {
            parameter: {
                leaf_count: 1024,
                leaf_deep : 10, 
                sample    : 10,

            },
            computility: {
                CPU: {
                    min: 1,
                    max: 8,
                }
            }
        },
        test02: {
            parameter: {
                leaf_count: 8388608,
                leaf_deep : 10,
                sample    : 10,
            },
            computility: {
                GTX_1050: {
                    min: 300,
                    max: 500,
                }
            }
        },
        test03: {
            parameter: {
                leaf_count: 1024,
                leaf_deep : 100, 
                sample    : 10,

            },
            computility: {
                CPU: {
                    min: 80,
                    max: 130,
                }
            }
        },
    },
    revenue_values: {
        H100_NVL:       1000,
        H100_SXM:       1000,
        H100_PCIE:      1000,
        A100_SXM:       800,
        A100_PCIE:      800,
        A800_80G_SXM:   400,
        A800_40G_PCIE:  300,
        A800_80G_PCIE:  400,
        H800:           200,
        GTX_1060:       150,
        GTX_1050:       100,
        CPU:            50,
    },
    default_revenue_value: {
        H100_NVL:       "H100_NVL",
        H100_SXM:       "H100_SXM",
        H100_PCIE:      "H100_PCIE",
        A100_SXM:       "A100_SXM",
        A100_PCIE:      "A100_PCIE",
        A800_80G_SXM:   "A800_80G_SXM",
        A800_40G_PCIE:  "A800_40G_PCIE",
        A800_80G_PCIE:  "A800_80G_PCIE",
        H800:           "H800",
        GTX_1060:       "GTX_1060",
        GTX_1050:       "GTX_1050",
        CPU:            "CPU",
    }
};

module.exports = {
    units 
};

