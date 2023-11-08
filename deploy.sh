#!/bin/sh

go build -ldflags="-s -w" -tags space/juejinSign -o demo && upx -9 space/juejinSign
cd space
space push