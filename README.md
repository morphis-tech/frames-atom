# Frames for Atom (aka Frames IDE)

This package provides basic support and syntax highlighting for [Frames](https://morphis-tech.com/products/frames.html) development in [Atom](https://atom.io/).

![A screenshot of your package](https://f.cloud.github.com/assets/69169/2290250/c35d867a-a017-11e3-86be-cd7c5bf3ff9b.gif)

## Installation

There's no packaging yet. So, you need to clone this repository first (develop branch).

### Requirements

First you need to install [NodeJs](https://nodejs.org/). Tested in the latest LTS version of NodeJS it's 4.3.x.

After that add Morphis repository. This command will register the Morphis Node repository in your system:
~~~bash
$ npm set registry http://node.srv.morphis-tech.com
~~~

### Initial Setup

1 - install the dependencies:

~~~bash
$ npm install
~~~

2 - link the package to your atom installation:

~~~bash
$ apm link
~~~

3 - And optionaly, you can start developing the package:

~~~bash
$ atom -d .
~~~
