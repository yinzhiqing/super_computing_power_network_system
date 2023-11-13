import sys
import json
import numpy as np
import mplcyberpunk
import matplotx
import matplotlib.pyplot as plt

def show_plot(data):
    fdata = json.loads(data);
    libname = fdata.get("libname", "matploty")

    if libname == 'matplotx':
        show_plot_matplotx(data)
    elif libname == 'cyberpunk':
        show_plot_cyberpunk(data)
    else:
        show_plot_std(data)

def show_plot_std(data):
  fdata = json.loads(data);
  title = fdata.get("title", "plot")
  x = fdata.get("x", [])
  y = fdata.get("y", [])

  plt.plot(x, y, marker = 'o')

  # 坐标轴名称
  plt.xlabel('X-Axis')
  plt.ylabel('Y-Axis')
  plt.title(title)

  plt.show()

def show_plot_matplotx(data):

  fdata = json.loads(data);
  title = fdata.get("title", "plot")
  x = fdata.get("x", [])
  y = fdata.get("y", [])
  plt.style.use(matplotx.styles.pitaya_smoothie['light'])
  #plt.figure(figsize=(8, 8))

  #plt.subplot(1,1,1)
  plt.plot(x, y, marker = 'o')

  # 坐标轴名称
  plt.xlabel('X-Axis')
  plt.ylabel('Y-Axis')
  plt.title(title)

  plt.show()

def show_plot_cyberpunk(data):
  fdata = json.loads(data);
  title = fdata.get("title", "plot")
  x = fdata.get("x", [])
  y = fdata.get("y", [])

  plt.style.use('cyberpunk')

  plt.plot(x, y, marker = 'o')
  mplcyberpunk.make_lines_glow()

  # 坐标轴名称
  plt.xlabel('X-Axis')
  plt.ylabel('Y-Axis')
  plt.title(title)

  plt.show()
if __name__ == "__main__":
   show_plot(sys.argv[1])
