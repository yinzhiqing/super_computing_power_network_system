
const path = require("path");

units = {
    gpus: {
        A100_40G : {
            type: "A100", 
            date: "1681881901", 
            producer: "NVIDIA", 
            FP64: 9.7, 
            FP64TC: 19.5, 
            FP32:19.5, 
            gpu_memory:"40GB HBM2", 
            gpu_bw:1935, 
            TDP:300, 
            INT8:624 
        },
        A100_80G : {
            type: "A100", 
            date: "1688881901", 
            producer: "NVIDIA", 
            FP64: 9.7, 
            FP64TC: 19.5, 
            FP32:19.5, 
            gpu_memory:"80GB HBM2", 
            gpu_bw:1935, 
            TDP:300, 
            INT8:624 
        },
        A100_160G : {
            type: "A100", 
            date: "1691881901", 
            producer: "NVIDIA", 
            FP64: 9.7, 
            FP64TC: 19.5, 
            FP32:19.5, 
            gpu_memory:"160GB HBM2", 
            gpu_bw:1935, 
            TDP:300, 
            INT8:624 
        },
        A800: {
            type: "A800", 
            date: "1691881901", 
            producer: "NVIDIA", 
        },
        H100: {
            type: "H100", 
            date: "1691881901", 
            producer: "NVIDIA", 
        },
        H800: {
            type: "H800", 
            date: "1691881901", 
            producer: "NVIDIA", 
        },
        GTX_1050: {
            type: "1050", 
            date: "1591881901", 
            producer: "NVIDIA", 
        },
        GTX_1060: {
            type: "1060", 
            date: "1641881901", 
            producer: "NVIDIA", 
        }
    }
};

module.exports = {
    units 
};

