#!/bin/sh

go build -ldflags="-s -w" -tags space/juejinSign -o space/juejinSign && upx -9 space/juejinSign
cd space
space push