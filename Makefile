# Makefile for formatting and code checks

BLACK_LINE_LENGTH=79
PYTHON_SRC=custom_components/vertical_farm

.PHONY: format lint oco all

all: format oco

format:
	black $(PYTHON_SRC) --line-length $(BLACK_LINE_LENGTH)

oco:
	oco $(PYTHON_SRC)
