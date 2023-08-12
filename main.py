import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import pandas as pd
from keras_visualizer import visualizer

np.set_printoptions(precision=3, suppress=True)

# data
# ├── input_rosters
# │   ├── 2017iri.csv
# │   ├── 2018iri.csv
# │   ├── 2019iri.csv
# │   └── 2022iri.csv
# └── performance
#     ├── epa
#     │   ├── epa2017.csv
#     │   ├── epa2018.csv
#     │   ├── epa2019.csv
#     │   ├── epa2022.csv
#     │   └── epa2023.csv
#     └── opr
#         ├── 2017iri.csv
#         ├── 2018iri.csv
#         ├── 2019iri.csv
#         └── 2022iri.csv

epa2017 = pd.read_csv("data/performance/epa/epa2017.csv", header=0, index_col=0)
epa2018 = pd.read_csv("data/performance/epa/epa2018.csv", header=0, index_col=0)
epa2019 = pd.read_csv("data/performance/epa/epa2019.csv", header=0, index_col=0)
epa2022 = pd.read_csv("data/performance/epa/epa2022.csv", header=0, index_col=0)
epa2023 = pd.read_csv("data/performance/epa/epa2023.csv", header=0, index_col=0)

points2017 = pd.read_csv("data/input_rosters/2017iri.csv", header=0, index_col=0)
points2018 = pd.read_csv("data/input_rosters/2018iri.csv", header=0, index_col=0)
points2019 = pd.read_csv("data/input_rosters/2019iri.csv", header=0, index_col=0)
points2022 = pd.read_csv("data/input_rosters/2022iri.csv", header=0, index_col=0)

opr2017 = pd.read_csv("data/performance/opr/2017iri.csv", header=0, index_col=0)
opr2018 = pd.read_csv("data/performance/opr/2018iri.csv", header=0, index_col=0)
opr2019 = pd.read_csv("data/performance/opr/2019iri.csv", header=0, index_col=0)
opr2022 = pd.read_csv("data/performance/opr/2022iri.csv", header=0, index_col=0)

# OPR is only meaningful for each year, so we need to normalize them by using mean normalization
opr2017 = (opr2017 - opr2017.mean()) / opr2017.std()
opr2018 = (opr2018 - opr2018.mean()) / opr2018.std()
opr2019 = (opr2019 - opr2019.mean()) / opr2019.std()
opr2022 = (opr2022 - opr2022.mean()) / opr2022.std()

combined_2017 = epa2017.join([points2017, opr2017])
combined_2018 = epa2018.join([points2018, opr2018])
combined_2019 = epa2019.join([points2019, opr2019])
combined_2022 = epa2022.join([points2022, opr2022])
combined_all = pd.concat(
    [combined_2017, combined_2018, combined_2019, combined_2022],
    ignore_index=True,
)

input_features = ["normalizedEpa"]
output_features = ["points", "opr"]

model = keras.Sequential(
    [
        layers.Dense(32, activation="relu", input_shape=[len(input_features)]),
        layers.Dense(32, activation="relu"),
        layers.Dense(2),
    ]
)

model.compile(
    optimizer="adam",
    loss="mean_absolute_error",
)

x_train = combined_all[input_features]
y_train = combined_all[output_features]

model.fit(
    x_train,
    y_train,
    epochs=1000,
    batch_size=1,
    verbose=1,
)

model.save("models/iri2023")

visualizer(model, file_format="png", file_name="model")

predictions = model.predict(epa2023)

# Print results
print("Predictions:")
for i in range(len(predictions)):
    print(
        f"{epa2023.index[i]}: {predictions[i][0]:.2f} points"
    )
