from flask import Flask, render_template, requests

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/lab", methods=["GET", "POST"])
def lab():
    if requests.method == "POST":
        pass # pass file in to render in lab
    return render_template("lab.html")

if __name__=="__main__":
    app.run()