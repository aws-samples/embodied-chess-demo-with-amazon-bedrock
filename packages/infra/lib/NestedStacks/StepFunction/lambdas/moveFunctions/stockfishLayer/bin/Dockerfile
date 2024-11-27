FROM public.ecr.aws/lambda/python:3.12-x86_64 AS builder

RUN dnf install g++ make git -y

RUN git clone https://github.com/official-stockfish/Stockfish.git /Stockfish
RUN cd /Stockfish && git checkout sf_17
WORKDIR /Stockfish/src

# Build Stockfish
RUN make -j profile-build
RUN make strip

# Copy the binary to local
FROM scratch
COPY --from=builder /Stockfish/src/stockfish /stockfish
