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
  rows = fdata.get("rows", 1)
  cols = fdata.get("cols", 1)
  xlabel = fdata.get("xlabel", "x")
  ylabel = fdata.get("ylabel", "y")
  plots = fdata.get("plots", [{}]);
  plt.figure(figsize=(8, 8))

  for i, plot in enumerate(plots, start=1):
      plt.subplot(rows, cols, i)
      plt.plot(plot["x"], plot["y"], lw=2)
      title = plot.get("title", "plot")
      plt.title(title)
      # 坐标轴名称
      plt.xlabel(xlabel)
      plt.ylabel(ylabel)

  plt.show()

def show_plot_matplotx(data):

  fdata = json.loads(data);
  rows = fdata.get("rows", 1)
  cols = fdata.get("cols", 1)
  xlabel = fdata.get("xlabel", "x")
  ylabel = fdata.get("ylabel", "y")
  plots = fdata.get("plots", [{}]);
  plt.style.use(matplotx.styles.pitaya_smoothie['light'])
  #plt.figure(figsize=(8, 8))

  for i, plot in enumerate(plots, start=1):
      plt.subplot(rows, cols, i)
      plt.plot(plot["x"], plot["y"])
      title = plot.get("title", "plot")
      plt.title(title)
      # 坐标轴名称
      plt.xlabel(xlabel)
      plt.ylabel(ylabel)


  plt.show()

def show_plot_cyberpunk(data):
  fdata = json.loads(data);
  title = fdata.get("title", "plot")
  x = fdata.get("x", [])
  y = fdata.get("y", [])

  plt.style.use('cyberpunk')

  #/plt.plot(x, y, marker = 'o')

  fdata = json.loads(data);
  rows = fdata.get("rows", 1)
  cols = fdata.get("cols", 1)
  xlabel = fdata.get("xlabel", "x")
  ylabel = fdata.get("ylabel", "y")
  plots = fdata.get("plots", [{}]);
  plt.style.use(matplotx.styles.pitaya_smoothie['light'])
  #plt.figure(figsize=(8, 8))

  for i, plot in enumerate(plots, start=1):
      plt.subplot(rows, cols, i)
      plt.plot(plot["x"], plot["y"])
      title = plot.get("title", "plot")
      mplcyberpunk.make_lines_glow()
      plt.title(title)
      # 坐标轴名称
      plt.xlabel(xlabel)
      plt.ylabel(ylabel)

  plt.show()

if __name__ == "__main__":
   show_plot(sys.argv[1])
